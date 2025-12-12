import { Injectable, OnInit, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Theme {
  currentTheme = signal<'dark' | 'light'>('dark');
  loadTheme(): void {
    if (!localStorage.getItem('theme')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      if (prefersDark.matches) {
        localStorage.setItem('theme', 'dark');
        this.setTheme('dark');
      } else {
        localStorage.setItem('theme', 'light');
        this.setTheme('light');
      }
    }

    this.setTheme(localStorage.getItem('theme')! as 'light' | 'dark');
  }

  getTheme(): 'light' | 'dark' {
    return this.currentTheme();
  }

  setTheme(theme: 'dark' | 'light' | 'system') {
    if (theme == 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      if (prefersDark.matches) {
        this.currentTheme.set('dark');
        document.body.setAttribute('data-theme', 'dark');
      } else {
        this.currentTheme.set('light');
        document.body.setAttribute('data-theme', 'light');
      }
    } else {
      this.currentTheme.set(theme);
      document.body.setAttribute('data-theme', theme);
    }
  }
}
