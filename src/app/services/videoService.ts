import { ElementRef, Injectable, Input, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './authService';
import videojs from 'video.js';

@Injectable({
  providedIn: 'root'
})
export class VideoService implements AfterViewInit, OnDestroy {
  private apiUrl = 'https://videoflix.rio-stenger.de/api/videos-by-genre/';
  private progressApiUrl = 'https://videoflix.rio-stenger.de/api/watch-progress/';


  @Input() videoId!: number;
  @Input() videoUrl!: string;
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  player!: videojs.Player;
  private saveInterval: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // 📌 Video.js Player starten & Fortschritt abrufen
  ngAfterViewInit(): void {
    if (!this.videoUrl || !this.videoId) return;

    this.initPlayer();
    this.loadProgress();
  }

  private initPlayer(): void {
    this.player = videojs(this.videoElement.nativeElement, {
      controls: true,
      autoplay: false,
      fluid: true, // Passt sich der Bildschirmgröße an
      sources: [
        {
          src: this.videoUrl,
          type: 'application/x-mpegURL' // HLS-Format
        }
      ]
    });

    // 📌 Fortschritt automatisch alle 5 Sekunden speichern
    this.saveInterval = setInterval(() => {
      this.saveProgress();
    }, 5000);

    // 📌 Fortschritt auf 0 setzen, wenn das Video zu Ende ist
    this.player.on('ended', () => this.saveProgress(true));
  }

  // 📌 🔥 Fortschritt speichern
saveProgress(isFinished: boolean = false): void {
  if (!this.videoId || !this.player) return;  // 🎯 Fix: `this.player` statt `this.videoElement`

  const progress = isFinished ? 0 : this.player.currentTime();  // 🎯 Fix: `this.player.currentTime()`

  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

  this.http.post(this.progressApiUrl, { video_id: this.videoId, timestamp: progress }, { headers })
    .subscribe({
      next: () => console.log(`📀 Fortschritt gespeichert: ${progress}s`),
      error: (err) => console.error('❌ Fehler beim Speichern:', err)
    });
}

loadProgress(): void {
  if (!this.videoId) {
    console.warn("⚠️ Kein `videoId`, Fortschritt kann nicht geladen werden!");
    return;
  }

  const token = this.authService.getToken();
  if (!token) {
    console.error("❌ Kein Auth-Token! Fortschritt kann nicht geladen werden.");
    return;
  }

  const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

  console.log(`📡 Lade Fortschritt für Video-ID: ${this.videoId} mit Token: ${token}`);

  this.http.get<{ progress: number }>(`${this.progressApiUrl}${this.videoId}/`, { headers })
    .subscribe({
      next: (response) => {
        const progress = response.progress ?? 0;
        console.log(`✅ Fortschritt geladen: ${progress}s`);

        if (this.player) {
          console.log("🔄 Fortschritt gesetzt:", progress);
          this.player.currentTime(progress);
        }
      },
      error: (err) => console.error('❌ Fehler beim Laden des Fortschritts:', err)
    });
}




  // 📌 API: Videos nach Genre abrufen
  getVideosByGenre(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    return this.http.get<any>(this.apiUrl, { headers });
  }

  // 📌 Player beenden & Speicher bereinigen
  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
    clearInterval(this.saveInterval);
  }
}
