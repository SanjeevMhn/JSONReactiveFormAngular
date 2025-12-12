import { AsyncPipe, JsonPipe, KeyValuePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { allowedThemesValidator } from '../../utils/customValidators/allowedThemesValidator';
import { isValidJson } from '../../utils/isValidJson';
import { Theme } from '../../services/theme';

@Component({
  selector: 'app-json-form',
  imports: [ReactiveFormsModule, AsyncPipe, KeyValuePipe, LucideAngularModule, JsonPipe],
  templateUrl: './json-form.html',
  styleUrl: './json-form.css',
})
export class JsonForm implements AfterViewInit, OnDestroy {
  deleteIcon = X;
  fb = inject(FormBuilder);
  jsonReactiveForm: FormGroup = this.fb.group({});
  allowedThemes = ['light', 'dark', 'system'];
  themeService = inject(Theme);

  noSort = () => 0; //prevent automatic sorting for reactive form key and value

  ngAfterViewInit() {
    this.jsonReactiveForm.get('settings')?.setValue({
      theme: this.themeService.getTheme(),
    });
  }

  //stores the inital json form object or gets it from localstorage if available
  jsonFormInitial = localStorage.getItem('form')
    ? JSON.parse(localStorage.getItem('form')!)
    : {
        name: 'Crewmojo Demo',
        description: 'Testing reactive form coding task',
        tags: ['angular', 'forms', 'json'],
        settings: {
          notifications: true,
          refreshInterval: 30,
          theme: 'dark',
        },
        members: [
          { id: 1, name: 'Alice', role: 'Admin' },
          { id: 2, name: 'Bob', role: 'User' },
        ],
      };

  //form group for json textarea
  jsonForm: FormGroup = new FormGroup({
    jsonFormControl: new FormControl(JSON.stringify(this.jsonFormInitial, null, 4)),
  });

  //form group for members form
  membersForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
  });

  //returns tags form array
  get tagsArray() {
    return this.jsonReactiveForm.get('tags') as FormArray;
  }

  //returns members form array
  get memberArray() {
    return this.jsonReactiveForm.get('members') as FormArray;
  }

  //returns settings form group
  get settingsGroup() {
    return this.jsonReactiveForm.get('settings') as FormGroup;
  }

  destroy$ = new Subject<void>();

  //checks for changes in the json textarea form control
  jsonDataChanges = this.jsonForm.get('jsonFormControl')?.valueChanges.pipe(
    startWith(JSON.stringify(this.jsonFormInitial)),
    debounceTime(500),
    filter((value) => {
      const isValid = isValidJson(value);
      if (!isValid) {
        this.showInvalidJSONMsg(true, 'Invalid JSON!');
      } else {
        this.showInvalidJSONMsg(false);
      }
      return isValid;
    }),
    map((value) => {
      this.jsonFormInitial = JSON.parse(value);
      return JSON.parse(value);
    }),
    tap((value) => {
      localStorage.setItem('form', JSON.stringify(value));
      this.createReactiveForm(value);
      if (
        value['settings']['theme'] == 'light' ||
        value['settings']['theme'] == 'dark' ||
        value['settings']['theme'] == 'system'
      ) {
        this.changeTheme({
          target: {
            value: value['settings']['theme'],
          },
        });
      }
    })
  );

  //creating the reactive form from the json
  createReactiveForm(value: any) {
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
    this.checkReactiveFormChange();
  }

  //checking for changes in the reactive form
  checkReactiveFormChange() {
    this.jsonReactiveForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.updatedJsonFormControl(value);
        if (this.jsonReactiveForm.invalid) {
          this.jsonReactiveForm.markAllAsTouched();
        }
      });
  }

  //add form controls for settings property
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
    message: '',
  };

  showInvalidJSONMsg(state: boolean, message?: string) {
    this.invalidJsonMsg = {
      show: state,
      message: message ? message : '',
    };
  }

  //when the reactive form is submitted
  reactiveFormValue:{[key:string]: any} | null = null
  @ViewChild('jsonFormDialog', {static: false}) jsonFormDialogRef!: ElementRef<HTMLDialogElement>
  reactiveFormSubmit() {
    if (this.jsonReactiveForm.invalid) {
      this.jsonReactiveForm.markAllAsTouched();
      return;
    }

    console.log(this.jsonReactiveForm.value);
    this.reactiveFormValue = this.jsonReactiveForm.value
    this.jsonFormDialogRef.nativeElement.showModal()
    document.body.classList.add('fixed-full-width')
  }

  closeJsonFormDialog(){
    this.jsonFormDialogRef.nativeElement.close()
    document.body.classList.remove('fixed-full-width')
  }

  @ViewChild('tagInput', { static: false }) tagInputRef!: ElementRef<HTMLInputElement>;

  //adding tags to the tag form array//
  addTag(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      const value = (event.target as HTMLInputElement).value;
      if (value !== '') {
        let updatedJson = {
          ...this.jsonFormInitial,
          tags: [...this.jsonFormInitial.tags, value],
        };

        this.updatedJsonFormControl(updatedJson);
        this.tagInputRef.nativeElement.value = '';
      }
    }
  }

  //removing tag//
  removeTag(index: number) {
    let updatedJson = {
      ...this.jsonFormInitial,
    };

    updatedJson.tags.splice(index, 1);
    this.updatedJsonFormControl(updatedJson);
  }

  //adding member to member form array//
  addMember() {
    if (this.membersForm.invalid) {
      return;
    }
    let updatedJson = this.jsonFormInitial;
    updatedJson.members.length > 0
      ? updatedJson.members.push({
          id: updatedJson.members[updatedJson.members.length - 1].id + 1,
          ...this.membersForm.value,
        })
      : updatedJson.members.push({
          id: 1,
          ...this.membersForm.value,
        });
    this.updatedJsonFormControl(updatedJson);
    this.membersForm.reset();
  }

  //removing member
  deleteMember(index: number) {
    let updatedJson = {
      ...this.jsonFormInitial,
    };

    updatedJson.members.splice(index, 1);
    this.updatedJsonFormControl(updatedJson);
  }

  /*
    1. update the json in textarea as per reactive form changes
    2. add the changes to localstorage
  */
  updatedJsonFormControl(value: any) {
    this.jsonFormInitial = value;
    localStorage.setItem('form', JSON.stringify(value));
    this.jsonForm.get('jsonFormControl')?.setValue(JSON.stringify(value, null, 4));
  }

  changeTheme(event: any) {
    this.themeService.setTheme(event.target.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
