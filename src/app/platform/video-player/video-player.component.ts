import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import videojs from 'video.js';
import Hls from 'hls.js';
import 'videojs-hls-quality-selector';


declare module 'video.js' {
  export interface VideoJsPlayer {
    hlsQualitySelector?: () => void;
  }
}

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss'
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() videoUrl!: string;
  @Input() isPlaying: boolean = false;
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  player!: videojs.Player;
  hls!: Hls;

  ngAfterViewInit(): void {
    if (this.videoUrl) {
      this.initPlayer();
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
    } else {
      this.player = videojs(videoElement, {
        controls: true,
        autoplay: this.isPlaying,
        fluid: true,
        sources: [{ src: this.videoUrl, type: 'application/x-mpegURL' }],
        tracks: [
          {
            srclang: 'en',
            label: 'English',
            default: true
          }
        ],
        controlBar: {
          volumePanel: { inline: false }
        }
      });
      
      this.player.ready(() => {
        console.log("Video.js Player ready!");
        if (this.player.hlsQualitySelector) {
            console.log("hlsQualitySelector Plugin gefunden!");
            this.player.hlsQualitySelector();
        } else {
            console.warn("⚠️ hlsQualitySelector Plugin nicht gefunden!");
        }
    });
    
    }
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
    if (this.hls) {
      this.hls.destroy();
    }
  }
}
