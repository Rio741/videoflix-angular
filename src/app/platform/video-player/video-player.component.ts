import { Component, AfterViewInit, OnDestroy, ElementRef, Input, ViewChild } from '@angular/core';
import videojs, { VideoJsPlayer } from 'video.js';
import Hls from 'hls.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() videoUrl!: string;
  @Input() videoId!: number;
  @Input() isPlaying: boolean = false;
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  player!: videojs.Player;
  hls!: Hls;
  availableQualities: any[] = [];
  selectedQualityIndex: number = -1;
  dropdownVisible: boolean = false;
  private saveInterval: any;
  private progressApiUrl = 'https://videoflix.rio-stenger.de/api/watch-progress/';

  constructor(private snackBar: MatSnackBar, private http: HttpClient, private authService: AuthService) {}

  ngAfterViewInit(): void {
    if (this.videoUrl) {
      this.initPlayer();
      this.loadProgress();
    }
  }

  private initPlayer(): void {
    const videoElement = this.videoElement.nativeElement;

    this.player = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: 'auto',
    });

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(this.videoUrl);
      this.hls.attachMedia(videoElement);

      this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        this.availableQualities = data.levels;
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

    this.saveInterval = setInterval(() => {
      this.saveProgress();
    }, 5000);

    videoElement.addEventListener('ended', () => this.saveProgress(true));

    this.createQualitySelector();
    this.createSkipButtons();
  }

  private createQualitySelector(): void {
    const player = this.player;
    const Button = videojs.getComponent('Button');
    const qualityButton = new Button(player);

    const icon = document.createElement('mat-icon');
    icon.innerText = 'quality';
    qualityButton.el().appendChild(icon);

    qualityButton.controlText('Qualität ändern');

    player.controlBar.addChild(qualityButton);

    // Füge eine Klick-Logik für den Button hinzu
    qualityButton.on('click', () => {
      this.toggleQualityDropdown();
    });
  }

  // Toggle-Funktion, um das Dropdown anzuzeigen/auszublenden
  toggleQualityDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;

    // Wenn das Dropdown sichtbar wird, dann fügen wir es dynamisch in die Steuerleiste ein
    if (this.dropdownVisible) {
      this.createDropdownMenu();
    } else {
      this.removeDropdownMenu();
    }
  }

  // Erstelle das Dropdown-Menü
  createDropdownMenu(): void {
    const controlBar = this.player.controlBar.el();

    // Dropdown-Menü Container
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'quality-dropdown-menu';
    
    // Dropdown-Optionen für jede verfügbare Qualität
    this.availableQualities.forEach((quality, index) => {
      const option = document.createElement('div');
      option.className = 'quality-option';
      option.innerText = `${quality.height}p`;
      option.onclick = () => {
        this.selectedQualityIndex = index;
        this.hls.currentLevel = index;
        this.snackBar.open(`Qualität geändert zu ${quality.height}p`, 'Schließen', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'center',
        });
        this.removeDropdownMenu();
      };
      dropdownMenu.appendChild(option);
    });

    // Füge das Dropdown nach dem Qualitätsbutton hinzu
    controlBar.appendChild(dropdownMenu);
  }

  // Entferne das Dropdown-Menü
  removeDropdownMenu(): void {
    const dropdownMenu = document.querySelector('.quality-dropdown-menu');
    if (dropdownMenu) {
      dropdownMenu.remove();
    }
  }

  private createSkipButtons(): void {
    const player = this.player;
    const Button = videojs.getComponent('Button');

    const skipBackButton = new Button(player);
    const skipForwardButton = new Button(player);

    const skipBackIcon = document.createElement('span');
    skipBackIcon.innerHTML = '⏪';
    skipBackButton.el().appendChild(skipBackIcon);
    skipBackButton.controlText('10s zurückspringen');

    const skipForwardIcon = document.createElement('span');
    skipForwardIcon.innerHTML = '⏩';
    skipForwardButton.el().appendChild(skipForwardIcon);
    skipForwardButton.controlText('10s vorspulen');

    const controlBar = player.controlBar.el();

    const playButton = player.controlBar.getChild('playToggle');
    if (playButton) {
      controlBar.insertBefore(skipBackButton.el(), playButton.el().nextSibling);
      controlBar.insertBefore(skipForwardButton.el(), skipBackButton.el().nextSibling);
    }

    skipBackButton.on('click', () => {
      this.skipTime(-10);
    });

    skipForwardButton.on('click', () => {
      this.skipTime(10);
    });
  }

  skipTime(seconds: number): void {
    const videoElement = this.videoElement.nativeElement;
    videoElement.currentTime += seconds;

    this.snackBar.open(`Gesprungen um ${seconds} Sekunden`, 'Schließen', {
      duration: 2000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  saveProgress(isFinished: boolean = false): void {
    if (!this.videoId || !this.videoElement) {
      console.warn('⚠️ saveProgress() abgebrochen – fehlende videoId oder videoElement!');
      return;
    }

    const videoElement = this.videoElement.nativeElement;
    const progress = isFinished ? 0 : (videoElement.currentTime || 0);

    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    this.http.post(this.progressApiUrl, { video_id: this.videoId, timestamp: progress }, { headers })
      .subscribe({
        next: () => console.log(`✅ Fortschritt erfolgreich gespeichert: ${progress}s`),
        error: (err) => console.error('❌ Fehler beim Speichern des Fortschritts:', err),
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
        error: (err) => console.error('❌ Fehler beim Laden des Fortschritts:', err),
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
  }
}
