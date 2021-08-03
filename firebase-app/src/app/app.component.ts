import { Component } from '@angular/core';
import { Task } from './task/task';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { AngularFirestore, AngularFirestoreCollection  } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { AngularFireRemoteConfig } from '@angular/fire/remote-config';

const getObservable = (collection: AngularFirestoreCollection<Task>) => {
  const subject = new BehaviorSubject<Task[]>([]);
  collection.valueChanges({ idField: 'id' }).subscribe((val: Task[]) => {
    subject.next(val);
  });
  return subject;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  todo = getObservable(this.store.collection('todo')) as Observable<Task[]>;
  inProgress = getObservable(this.store.collection('inProgress')) as Observable<Task[]>;
  done = getObservable(this.store.collection('done')) as Observable<Task[]>;

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult) => {
      if (result.delete) {
        this.store.collection(list).doc(task.id).delete();
      } else {
        this.store.collection(list).doc(task.id).update(task);
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>): void {
  if (event.previousContainer === event.container) {
    return;
  }
  const item = event.previousContainer.data[event.previousIndex];
  this.store.firestore.runTransaction(() => {
    const promise = Promise.all([
      this.store.collection(event.previousContainer.id).doc(item.id).delete(),
      this.store.collection(event.container.id).add(item),
    ]);
    return promise;
  });
  transferArrayItem(
    event.previousContainer.data,
    event.container.data,
    event.previousIndex,
    event.currentIndex
  );
}

  header_color:any;
  remote_param:any;
  constructor(private dialog: MatDialog, private store: AngularFirestore, remoteConfig: AngularFireRemoteConfig) {
    /* ======================================================
    experiment to test how remote config properties change. 
    ========================================================= */


    // retrieves default remote config params and sets them to variables
    // 1. header_color
    console.log(remoteConfig.getAll())
    remoteConfig.getString('header_color').then(val => {
      this.header_color = val
    })

    // 2. parameter_string
    remoteConfig.getString('remote_param_2').then(val => {
      this.remote_param = val
    })
    
    // Fetchs the remote parameters from firebase console 
    remoteConfig.fetchAndActivate()
    
    // After five seconds, resets default parameters with remote parameters  
    setTimeout(() => {
      console.log(remoteConfig.getAll());
      remoteConfig.getString('header_color').then(val => {
        this.header_color = val
      });
      remoteConfig.getString('remote_param_2').then(val => {
        this.remote_param = val
      }) 
    }, 5_000);

    setTimeout(() => {
      console.log(this.header_color)
    }, 5_000);

    /* ===================================== 
                  END Experiment
    ========================================*/

  };

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult) => this.store.collection('todo').add(result.task));
  }
}