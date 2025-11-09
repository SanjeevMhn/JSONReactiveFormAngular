import { AsyncPipe, JsonPipe, KeyValuePipe } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map, of, startWith, Subject, takeUntil, tap } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-json-form',
  imports: [ReactiveFormsModule, AsyncPipe, JsonPipe, KeyValuePipe, LucideAngularModule],
  templateUrl: './json-form.html',
  styleUrl: './json-form.css',
})
export class JsonForm implements OnDestroy {
  deleteIcon = X;
  fb = inject(FormBuilder);
  jsonReactiveForm: FormGroup = this.fb.group({});

  noSort = () => 0;

  jsonFormInitial = {
    name: 'Crewmojo Demo',
    description: 'Testing reactive form coding task',
    tags: ['angular', 'forms', 'json'],
    settings: {
      notifications: true,
      theme: 'dark',
      refreshInterval: 30,
    },
    members: [
      { id: 1, name: 'Alice', role: 'Admin' },
      { id: 2, name: 'Bob', role: 'User' },
    ],
  };

  jsonForm: FormGroup = new FormGroup({
    jsonFormControl: new FormControl(JSON.stringify(this.jsonFormInitial, null, 4)),
  });

  get tagsArray() {
    return this.jsonReactiveForm.get('tags') as FormArray;
  }

  get memberArray() {
    return this.jsonReactiveForm.get('members') as FormArray;
  }

  get settingsGroup() {
    return this.jsonReactiveForm.get('settings') as FormGroup;
  }

  isValidJson(jsonString: string): boolean {
    if (typeof jsonString !== 'string' || jsonString.trim() === '') {
      return false;
    }
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  }

  destroy$ = new Subject<void>()

  jsonDataChanges = this.jsonForm.get('jsonFormControl')?.valueChanges.pipe(
    startWith(JSON.stringify(this.jsonFormInitial)),
    debounceTime(900),
    distinctUntilChanged(),
    filter((value) => {
      const isValid = this.isValidJson(value);
      return isValid;
    }),
    map((value) => {
      return JSON.parse(value);
    }),
    tap((value) => {
      this.jsonReactiveForm = this.fb.group({});
      for (const [key, val] of Object.entries(value)) {
        this.jsonReactiveForm.addControl(
          key,
          key == 'settings'
            ? this.fb.group(value[key])
            : key == 'tags'
            ? this.fb.array([...value[key]])
            : key == 'members'
            ? this.fb.array([...value[key]])
            : this.fb.control(val)
        );
      }
      this.jsonReactiveForm.valueChanges.pipe(
        debounceTime(900),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(value => {
        this.jsonForm.get('jsonFormControl')?.setValue(JSON.stringify(value, null, 4))
      })
    })
  );


  reactiveFormSubmit() {
    console.log(this.jsonReactiveForm);
  }

  ngOnDestroy(): void {
      this.destroy$.next()
      this.destroy$.complete()
  }
}
