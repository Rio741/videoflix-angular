import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/authService';
import { VideoService } from '../../services/videoService';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterModule, CommonModule, VideoPlayerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  categories: any[] = [];
  selectedVideo: any = null;
  isVideoPlaying: boolean = false;
  videoUrl: string = '';
  searchQuery: string = '';
  filteredVideos: any[] = [];

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(private authService: AuthService, private router: Router, private videoService: VideoService) {}

  ngOnInit(): void {
    forkJoin([
      this.videoService.getVideosByGenre(),
      this.videoService.getStartedVideos()
    ]).subscribe(([categories, startedVideos]) => {
      if (startedVideos && startedVideos.length > 0) {
        categories.unshift({
          genre: { name: 'Angefangene Videos' },
          videos: startedVideos
        });
      }
      this.categories = categories;
    });

    // Debounced Suchverhalten
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(query => this.performSearch(query));
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  onSearch(event: any): void {
    this.searchSubject.next(event.target.value.toLowerCase());
  }

  private performSearch(query: string): void {
    this.searchQuery = query;

    if (!query) {
      this.filteredVideos = [];
      return;
    }

    const searchCategories = this.categories.filter(
      category => category.genre.name !== 'Angefangene Videos'
    );

    this.filteredVideos = searchCategories.flatMap(category =>
      category.videos.filter((video: any) =>
        video.title.toLowerCase().includes(query)
      )
    );
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onVideoClick(video: any): void {
    this.selectedVideo = video;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPlayVideo(): void {
    if (this.selectedVideo) {
      this.videoUrl = `https://videoflix.rio-stenger.de${this.selectedVideo.hls_master_playlist}`;
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
