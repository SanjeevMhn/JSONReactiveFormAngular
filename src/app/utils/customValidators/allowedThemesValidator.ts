import { AbstractControl, ValidationErrors } from '@angular/forms';

export function allowedThemesValidator(allowedThemes: Array<string>) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value == '') return null;
    return allowedThemes.includes(value) ? null : { allowedThemes: { value } };
  };
}
