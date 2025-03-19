import { ElementRef, Injectable, Input, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './authService';
import videojs from 'video.js';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://127.0.0.1:8000/api/videos-by-genre/';
  @Input() videoUrl!: string;
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  player!: videojs.Player;

  constructor(private http: HttpClient, private authService: AuthService) { }

  ngAfterViewInit(): void {
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
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
  }

  getVideosByGenre(): Observable<any> {
    // Hole den Token aus dem AuthService
    const token = this.authService.getToken();

    // Wenn der Token vorhanden ist, füge ihn in die HTTP-Header ein
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    // Führe die GET-Anfrage mit den Headern durch
    return this.http.get<any>(this.apiUrl, { headers });
  }
}
