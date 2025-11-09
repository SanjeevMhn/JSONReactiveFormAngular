import { AsyncPipe, JsonPipe, KeyValuePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  filter,
  identity,
  map,
  of,
  startWith,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { allowedThemesValidator } from '../../utils/customValidators/allowedThemesValidator';

@Component({
  selector: 'app-json-form',
  imports: [ReactiveFormsModule, AsyncPipe, KeyValuePipe, LucideAngularModule],
  templateUrl: './json-form.html',
  styleUrl: './json-form.css',
})
export class JsonForm implements OnDestroy {
  deleteIcon = X;
  fb = inject(FormBuilder);
  jsonReactiveForm: FormGroup = this.fb.group({});
  allowedThemes = ['light', 'dark', 'system'];

  noSort = () => 0;

  jsonFormInitial = localStorage.getItem('form')
    ? JSON.parse(localStorage.getItem('form')!)
    : {
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

  membersForm: FormGroup = new FormGroup({
    name: new FormControl(''),
    role: new FormControl(''),
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

  destroy$ = new Subject<void>();
  shouldDebounce = true;

  jsonDataChanges = this.jsonForm.get('jsonFormControl')?.valueChanges.pipe(
    startWith(JSON.stringify(this.jsonFormInitial)),
    debounceTime(500),
    filter((value) => {
      const isValid = this.isValidJson(value);
      if (!isValid) {
        this.showInvalidJSONMsg(true, 'Invalid JSON!');
      }
      return isValid;
    }),
    map((value) => {
      return JSON.parse(value);
    }),
    tap((value) => {
      localStorage.setItem('form', JSON.stringify(value));
      this.jsonReactiveForm = this.fb.group({});
      for (const [key, val] of Object.entries(value)) {
        this.jsonReactiveForm.addControl(
          key,
          key == 'settings'
            ? this.settingsFormGroup(value[key])
            : key == 'tags'
            ? this.fb.array([...value[key]])
            : key == 'members'
            ? this.fb.array([...value[key]])
            : key == 'name'
            ? this.fb.control(val, [Validators.required, Validators.minLength(3)])
            : this.fb.control(val)
        );
      }
      this.jsonReactiveForm.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe((value) => {
          this.updatedJsonFormControl(value);
          if (this.jsonReactiveForm.invalid) {
            this.jsonReactiveForm.markAllAsTouched();
          }
        });
    })
  );

  settingsFormGroup(obj: any) {
    const group: { [key: string]: any } = {};
    Object.entries(obj).forEach(([key, val]) => {
      group[key] = [
        val ?? 0,
        key == 'refreshInterval'
          ? [Validators.min(1)]
          : key == 'theme'
          ? [allowedThemesValidator(this.allowedThemes)]
          : [],
      ];
    });

    return this.fb.group(group);
  }

  invalidJsonMsg = {
    show: false,
    message: ''
  };

  showInvalidJSONMsg(state: boolean, message?:string) {
    this.invalidJsonMsg = {
      show: true,
      message: message ? message : ''
    }
  }

  reactiveFormSubmit() {
    if (this.jsonReactiveForm.invalid) {
      this.jsonReactiveForm.markAllAsTouched();
      console.log(this.jsonReactiveForm);
      return;
    }
  }

  @ViewChild('tagInput', { static: false }) tagInputRef!: ElementRef<HTMLInputElement>;

  addTag(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      const value = (event.target as HTMLInputElement).value;
      let updatedJson = {
        ...this.jsonFormInitial,
        tags: [...this.jsonFormInitial.tags, value],
      };

      this.updatedJsonFormControl(updatedJson);
      this.tagInputRef.nativeElement.value = '';
    }
  }

  removeTag(index: number) {
    let updatedJson = {
      ...this.jsonFormInitial,
    };

    updatedJson.tags.splice(index, 1);
    this.updatedJsonFormControl(updatedJson);
  }

  addMember() {
    if (this.membersForm.value) {
      let updatedJson = this.jsonFormInitial;
      updatedJson.members.push({
        id: updatedJson.members.length + 1,
        ...this.membersForm.value,
      });
      this.updatedJsonFormControl(updatedJson);
      this.membersForm.reset();
    }
  }

  deleteMember(index: number) {
    let updatedJson = {
      ...this.jsonFormInitial,
    };

    updatedJson.members.splice(index, 1);
    this.updatedJsonFormControl(updatedJson);
  }

  updatedJsonFormControl(value: any) {
    this.jsonFormInitial = value;
    localStorage.setItem('form', JSON.stringify(value));
    this.jsonForm.get('jsonFormControl')?.setValue(JSON.stringify(value, null, 4));
    this.shouldDebounce = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
