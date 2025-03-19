import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/authService';
import { VideoService } from '../../services/videoService';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from '../video-player/video-player.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterModule, CommonModule, VideoPlayerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  categories: any[] = [];
  selectedVideo: any = null;
  isVideoPlaying: boolean = false;
  videoUrl: string = '';

  searchQuery: string = '';
filteredVideos: any[] = [];

onSearch(event: any): void {
  this.searchQuery = event.target.value.toLowerCase();

  this.filteredVideos = this.categories.flatMap(category =>
    category.videos.filter((video: any) =>
      video.title.toLowerCase().includes(this.searchQuery)
    )
  );
}


  constructor(private authService: AuthService, private router: Router, private videoService: VideoService) { }

  ngOnInit(): void {
    this.videoService.getVideosByGenre().subscribe(data => {
      this.categories = data;
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onVideoClick(video: any): void {
    this.selectedVideo = video;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ✅ Wird erst beim Klicken auf "Play" aufgerufen
  onPlayVideo(): void {
    if (this.selectedVideo) {
      this.videoUrl = `http://127.0.0.1:8000${this.selectedVideo.hls_master_playlist}`;

      this.isVideoPlaying = true;
    }
  }

  closePlayer() {
    this.isVideoPlaying = false;
  }

  scrollToCategory() {
    const element = document.getElementById("category-container");
    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

}
