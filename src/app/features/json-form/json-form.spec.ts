import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonForm } from './json-form';

describe('JsonForm', () => {
  let component: JsonForm;
  let fixture: ComponentFixture<JsonForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
