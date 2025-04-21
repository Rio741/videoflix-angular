import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  Input,
  ViewChild,
  HostListener,
} from '@angular/core';
import videojs from 'video.js';
import Hls from 'hls.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/authService';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() videoUrl!: string;
  @Input() videoId!: number;
  @Input() isPlaying: boolean = false;
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  @ViewChild('container', { static: false }) containerRef!: ElementRef;

  player!: videojs.Player;
  hls!: Hls;
  private saveInterval: any;
  private inactivityTimeout: any;
  private controlsVisible: boolean = false;
  private isPaused: boolean = false;
  private progressApiUrl = 'https://videoflix.rio-stenger.de/api/watch-progress/';

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngAfterViewInit(): void {
    if (this.videoUrl) {
      this.initPlayer();
      this.loadProgress();
    }
  }

  private initPlayer(): void {
    const videoElement = this.videoElement.nativeElement;

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(this.videoUrl);
      this.hls.attachMedia(videoElement);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (this.isPlaying) {
          videoElement.play();
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = this.videoUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        if (this.isPlaying) {
          videoElement.play();
        }
      });
    }

    this.saveInterval = setInterval(() => {
      this.saveProgress();
    }, 5000);

    videoElement.addEventListener('ended', () => this.saveProgress(true));
    videoElement.addEventListener('pause', () => {
      this.isPaused = true;
      this.showControls();
      this.clearInactivityTimeout();
    });

    videoElement.addEventListener('play', () => {
      this.isPaused = false;
      this.resetInactivityTimeout();
    });
  }

  changeQuality(resolution: string): void {
    const levelMap: { [key: string]: number } = {
      '480': 0,
      '720': 1,
      '1080': 2,
    };

    const levelIndex = levelMap[resolution];
    if (this.hls && typeof levelIndex === 'number') {
      this.hls.currentLevel = levelIndex;
      this.snackBar.open(`Qualität auf ${resolution}p gesetzt`, 'OK', {
        duration: 3000,
      });
    }
  }

  rewindVideo(): void {
    const video = this.videoElement?.nativeElement;
    if (video) video.currentTime -= 10;
  }

  fastForwardVideo(): void {
    const video = this.videoElement?.nativeElement;
    if (video) video.currentTime += 10;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    const video = this.videoElement?.nativeElement;
    if (!video) return;

    switch (event.key) {
      case 'ArrowRight':
        video.currentTime += 10;
        break;
      case 'ArrowLeft':
        video.currentTime -= 10;
        break;
      case ' ':
        event.preventDefault();
        video.paused ? video.play() : video.pause();
        break;
      case 'm':
        video.muted = !video.muted;
        break;
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(): void {
    if (!this.controlsVisible) {
      this.showControls();
    }
    if (!this.isPaused) {
      this.resetInactivityTimeout();
    }
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(): void {
    if (!this.isPaused) {
      this.hideControls();
    }
  }

  private showControls(): void {
    const controls = this.containerRef.nativeElement.querySelector('.custom-controls');
    if (controls) {
      controls.style.opacity = '1';
      controls.style.transition = 'opacity 0.5s ease-in-out';
      this.controlsVisible = true;
    }
  }

  private hideControls(): void {
    if (this.isPaused) return;
    const controls = this.containerRef.nativeElement.querySelector('.custom-controls');
    if (controls) {
      controls.style.opacity = '0';
      controls.style.transition = 'opacity 1.5s ease-in-out';
      this.controlsVisible = false;
    }
  }

  private clearInactivityTimeout(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  private resetInactivityTimeout(): void {
    this.clearInactivityTimeout();

    this.inactivityTimeout = setTimeout(() => {
      this.hideControls();
    }, 2000);
  }

  saveProgress(isFinished: boolean = false): void {
    if (!this.videoId || !this.videoElement) return;

    const videoElement = this.videoElement.nativeElement;
    const progress = isFinished ? 0 : videoElement.currentTime || 0;

    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    this.http
      .post(this.progressApiUrl, { video_id: this.videoId, timestamp: progress }, { headers })
      .subscribe();
  }

  loadProgress(): void {
    if (!this.videoId) return;

    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    this.http
      .get<{ progress: number }>(`${this.progressApiUrl}${this.videoId}/`, { headers })
      .subscribe({
        next: (response) => {
          const progress = response.progress ?? 0;
          if (
            this.videoElement &&
            this.videoElement.nativeElement &&
            typeof progress === 'number' &&
            progress > 5
          ) {
            this.askToResumeProgress(progress);
          }
        },
        error: (err) => console.error('Fehler beim Laden des Fortschritts:', err),
      });
  }

  private askToResumeProgress(progress: number): void {
    const snackBarRef = this.snackBar.open(
      `Fortsetzen bei ${Math.floor(progress)}s?`,
      'Fortsetzen',
      { duration: 5000 }
    );

    snackBarRef.onAction().subscribe(() => {
      if (this.videoElement) {
        this.videoElement.nativeElement.currentTime = progress;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
    if (this.hls) {
      this.hls.destroy();
    }
    clearInterval(this.saveInterval);
    this.clearInactivityTimeout();
  }
}
