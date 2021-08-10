import { Component, OnInit } from '@angular/core';
import { Task } from './task/task';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { AngularFirestore, AngularFirestoreCollection  } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { AngularFireRemoteConfig } from '@angular/fire/remote-config';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { UserDialogComponent, UserDialogResult } from './user-dialog/user-dialog.component';

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
export class AppComponent implements OnInit {
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
        this.analytics.logEvent('delete_task', {'title': result.task.title, 'description': result.task.description});
      } else {
        this.store.collection(list).doc(task.id).update(task);
        this.analytics.logEvent('update_task', {'title': result.task.title, 'description': result.task.description});
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
    ])
    this.analytics.logEvent('move_task', {'title': item.title, 'description': item.description, 'from_column': event.previousContainer.id, 'to_column': event.container.id});;
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
  private analytics: AngularFireAnalytics
  constructor(private dialog: MatDialog, private store: AngularFirestore, 
    remoteConfig: AngularFireRemoteConfig, analytics: AngularFireAnalytics) {
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


    /* ======================================================
                      Initialise custom logging 
    ========================================================= */
    this.analytics = analytics
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
      dialogRef.afterClosed().subscribe((result: TaskDialogResult) => this.analytics.logEvent('new_task', {'title': result.task.title, 'description': result.task.description}))
  };

  ngOnInit(): void {
    setTimeout(() => {
      this.setName()
    }, 10_000);
  }

  user_name: string;
  setName(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '400px',
      data: "",
    });
    dialogRef
      .afterClosed()
      .subscribe((result: UserDialogResult) => this.analytics.setUserProperties({'CD_Username':result.userName}));
    dialogRef
      .afterClosed()
      .subscribe((result: UserDialogResult) => this.user_name = result.userName);
  }
}