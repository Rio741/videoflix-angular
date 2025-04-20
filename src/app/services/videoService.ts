import { ElementRef, Injectable, Input, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './authService';
import videojs from 'video.js';

@Injectable({
  providedIn: 'root'
})
export class VideoService implements AfterViewInit, OnDestroy {
  private videosByGenreUrl = 'https://videoflix.rio-stenger.de/api/videos-by-genre/';
  private watchProgressUrl = 'https://videoflix.rio-stenger.de/api/watch-progress/';
  private startedVideosUrl = 'https://videoflix.rio-stenger.de/api/started-videos/';
  
  @Input() videoId!: number;
  @Input() videoUrl!: string;
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;

  player!: videojs.Player;
  private saveInterval: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngAfterViewInit(): void {
    if (!this.videoUrl || !this.videoId) return;
    this.initPlayer();
    this.loadProgress();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Token ${token}`);
  }

  private initPlayer(): void {
    this.player = videojs(this.videoElement.nativeElement, {
      controls: true,
      autoplay: false,
      fluid: true,
      sources: [
        {
          src: this.videoUrl,
          type: 'application/x-mpegURL'
        }
      ]
    });

    this.saveInterval = setInterval(() => {
      this.saveProgress();
    }, 5000);

    this.player.on('ended', () => this.saveProgress(true));
  }

  saveProgress(isFinished: boolean = false): void {
    if (!this.videoId || !this.player) return;

    const progress = isFinished ? 0 : this.player.currentTime();

    this.http.post(this.watchProgressUrl, { video_id: this.videoId, timestamp: progress }, { headers: this.getAuthHeaders() })
      .subscribe();
  }

  loadProgress(): void {
    if (!this.videoId) return;

    const token = this.authService.getToken();
    if (!token) return;

    this.http.get<{ progress: number }>(`${this.watchProgressUrl}${this.videoId}/`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (response) => {
          const progress = response.progress ?? 0;
          if (this.player) {
            this.player.currentTime(progress);
          }
        }
      });
  }

  getVideosByGenre(): Observable<any> {
    return this.http.get<any>(this.videosByGenreUrl, { headers: this.getAuthHeaders() });
  }

  getStartedVideos(): Observable<any[]> {
    return this.http.get<any[]>(this.startedVideosUrl, { headers: this.getAuthHeaders() });
  }
  
  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
    clearInterval(this.saveInterval);
  }
}
