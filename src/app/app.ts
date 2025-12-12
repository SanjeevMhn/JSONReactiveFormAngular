import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Theme } from './services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{
  protected readonly title = signal('json-reactive-form');
  themeService = inject(Theme)

  ngOnInit(): void {
    this.themeService.loadTheme()
  }
}
