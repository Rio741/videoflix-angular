import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import videojs from 'video.js';
import Hls from 'hls.js';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import 'videojs-http-source-selector'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss'
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {

  constructor(private snackBar: MatSnackBar, private http: HttpClient, private authService: AuthService) {}

  @Input() videoUrl!: string;
  @Input() videoId!: number;  // Eindeutige ID für das Video
  @Input() isPlaying: boolean = false;
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  player!: videojs.Player;
  hls!: Hls;
  availableQualities: any[] = [];
  selectedQualityIndex: number = -1;
  private saveInterval: any;
  private progressApiUrl = 'http://127.0.0.1:8000/api/watch-progress/';

  ngAfterViewInit(): void {
    console.log("🔍 Video ID:", this.videoId);
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

      this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        this.availableQualities = data.levels;
        console.log('Verfügbare Qualitäten:', this.availableQualities);

        if (this.selectedQualityIndex === -1) {
          this.selectedQualityIndex = 0;
          this.hls.startLevel = this.selectedQualityIndex;
        }
      });

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

    // 🔥 Fortschritt alle 5 Sekunden speichern
    this.saveInterval = setInterval(() => {
      this.saveProgress();
    }, 5000);

    // 🔥 Wenn das Video endet, Fortschritt auf 0 setzen
    videoElement.addEventListener('ended', () => this.saveProgress(true));
  }

  changeQuality(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedIndex = parseInt(selectElement.value, 10);
  
    if (this.hls && selectedIndex !== undefined) {
      this.hls.currentLevel = selectedIndex;
      this.selectedQualityIndex = selectedIndex;
  
      const qualityText = this.availableQualities[selectedIndex]?.height + 'p';
  
      this.snackBar.open(`Qualität geändert zu ${qualityText}`, 'Schließen', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center'
      });
    }
  }


  saveProgress(isFinished: boolean = false): void {
    console.log("🔍 saveProgress() wurde aufgerufen! isFinished:", isFinished);
  
    if (!this.videoId || !this.videoElement) {
      console.warn("⚠️ saveProgress() abgebrochen – fehlende videoId oder videoElement!");
      return;
    }
  
    const videoElement = this.videoElement.nativeElement;
    const progress = isFinished ? 0 : (videoElement.currentTime || 0);
  
    console.log(`📀 Speichere Fortschritt: ${progress}s für Video-ID: ${this.videoId}`);
  
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
  
    this.http.post(this.progressApiUrl, { video_id: this.videoId, timestamp: progress }, { headers })
      .subscribe({
        next: () => console.log(`✅ Fortschritt erfolgreich gespeichert: ${progress}s`),
        error: (err) => console.error('❌ Fehler beim Speichern des Fortschritts:', err)
      });
  }
  
  

  loadProgress(): void {
    if (!this.videoId) return;

    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    this.http.get<{ progress: number }>(`${this.progressApiUrl}${this.videoId}/`, { headers })
      .subscribe({
        next: (response) => {
          const progress = response.progress ?? 0;
          if (this.videoElement && this.videoElement.nativeElement && typeof progress === 'number' && progress > 5) {  
            this.askToResumeProgress(progress);
          }
        },
        error: (err) => console.error('❌ Fehler beim Laden des Fortschritts:', err)
      });
  }

  // 📌 🔥 Benutzer fragen, ob er fortsetzen möchte (SnackBar mit Buttons)
  private askToResumeProgress(progress: number): void {
    const snackBarRef = this.snackBar.open(
      `Fortsetzen bei ${Math.floor(progress)}s?`, 
      'Fortsetzen', 
      { duration: 5000 } // Schließt sich nach 5 Sekunden
    );

    snackBarRef.onAction().subscribe(() => {
      if (this.videoElement) {
        this.videoElement.nativeElement.currentTime = progress;
        console.log(`🔄 Fortschritt geladen und gesetzt: ${progress}s`);
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
  }
}
