import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartsideComponent } from './landing-page.component';

describe('StartsideComponent', () => {
  let component: StartsideComponent;
  let fixture: ComponentFixture<StartsideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartsideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartsideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
