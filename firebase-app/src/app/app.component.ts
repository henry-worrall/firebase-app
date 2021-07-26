import { Component } from '@angular/core';
import { Task } from './task/task';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  todo: Task[] = [
    {
      title: 'Be awesome!',
      description: 'Go out and be awesome'
    },
    {
      title: 'Create an Angular Firebase app',
      description: 'Using Firebase and Angular create a app!'
    }
  ];
}