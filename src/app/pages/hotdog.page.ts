import { Component, ElementRef, HostBinding, ViewChild } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideXCircle } from '@ng-icons/lucide';
import { HlmButtonModule } from '@spartan-ng/ui-button-helm';
import { WebcamModule } from 'ngx-webcam';
import { HlmCardContentDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardDescriptionDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardFooterDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardHeaderDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardTitleDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmIconComponent } from '../../../libs/ui/ui-icon-helm/src/lib/hlm-icon.component';
import {
  HlmTabsComponent,
  HlmTabsContentDirective,
  HlmTabsListComponent,
  HlmTabsTriggerDirective,
} from '@spartan-ng/ui-tabs-helm';
import { PercentPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
// Load mobilenet module from tensorflow
// import * as mobilenet from '@tensorflow-models/mobilenet';
// import { setBackend } from '@tensorflow/tfjs';
// import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';

// setWasmPaths(
//   'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/wasm-out/'
// );
// setBackend('wasm').then(() => console.log('set backend to wasm'));

@Component({
  selector: 'app-hotdog',
  standalone: true,
  imports: [
    HlmCardContentDirective,
    HlmCardDescriptionDirective,
    HlmCardDirective,
    HlmCardFooterDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmIconComponent,
    HlmButtonModule,
    HlmTabsComponent,
    HlmTabsContentDirective,
    HlmTabsListComponent,
    HlmTabsTriggerDirective,
    WebcamModule,
    PercentPipe,
    RouterModule,
  ],
  providers: [provideIcons({ lucideChevronLeft, lucideXCircle })],
  template: `
    <!-- HotDog classifier app -->
    <div class="h-full overflow-hidden flex flex-col gap-4">
      <section hlmCard class="flex flex-row items-center justify-between">
        <div hlmCardHeader class="flex flex-row gap-2 items-center">
          <button hlmBtn size="icon" variant="outline" routerLink="../">
            <hlm-icon size="lg" name="lucideChevronLeft" />
          </button>
          <h3 hlmCardTitle>Is an 🌭 ?</h3>
        </div>
        <div hlmCardContent class="flex flex-col  items-center gap-4 pb-0">
          <p hlmCardDescription>
            Upload an image or use your webcam to classify if it's a hotdog or
            not.
          </p>
        </div>
      </section>

      <hlm-tabs tab="upload" class="flex flex-col flex-1 w-full">
        <hlm-tabs-list
          class="w-full grid grid-cols-1"
          aria-label="tabs example"
        >
          <button hlmTabsTrigger="upload">Upload</button>
        </hlm-tabs-list>
        <div hlmTabsContent="upload" class="flex-auto">
          <div
            class="flex-auto grid grid-flow-row grid-cols-2 row-auto gap-2 h-full"
          >
            <div hlmCard>
              <div hlmCardHeader>
                <h3 hlmCardTitle>Upload Image</h3>
              </div>
              <div hlmCardContent class="flex flex-col gap-5">
                <input
                  type="file"
                  accept="image/*"
                  (change)="onFileChanged($event)"
                />
                <img
                  [src]="imageUrl || 'https://via.placeholder.com/300'"
                  #image
                  alt="the image to analyze"
                  class="w-full h-auto max-h-[480px] object-contain"
                />
              </div>
            </div>
            <div hlmCard class="h-full">
              <div
                class="h-full flex flex-col gap-5 justify-center items-center"
              >
                <p class="text-7xl">🌭</p>
                @if (runningPrediction) {
                <h4 class="text-2xl font-bold text-orange-600 animate-pulse">
                  Analyzing the image...
                </h4>
                } @else { @if (isAnHotdog === null) {
                <h4 class="text-2xl font-bold text-orange-600 animate-pulse">
                  Waiting for the image to analyze...
                </h4>
                } @else if (isAnHotdog === false) {
                <img
                  src="https://y.yarn.co/da23cf5b-4e41-416f-8829-d150e9a24365_text.gif"
                  class="max-w-lg"
                />
                <p class="text-2xl text-red-700">The image is not an hotdog</p>
                } @else {
                <img
                  src="https://miro.medium.com/v2/resize:fit:800/1*u-y_I9JQ8pCbLJeGkLjByw.gif"
                  class="max-w-lg"
                />
                <p class="text-2xl text-green-700">The image is an hotdog</p>
                }
                <div
                  class="text-sm opacity-75 bg-slate-300 rounded-md w-full max-w-lg p-2"
                >
                  Predictions: <br />
                  <ul>
                    @for(prediction of latestPredictions; track $index){
                    <li>
                      <span class="text-orange-800">{{
                        prediction.className
                      }}</span
                      >:
                      <span class="font-semibold">{{
                        prediction.probability | percent : '1.0-5'
                      }}</span>
                    </li>
                    }
                  </ul>
                </div>
                }
              </div>
            </div>
          </div>
        </div>
      </hlm-tabs>
    </div>
  `,
})
export class HotdogPage {
  @HostBinding('class') class = 'flex-1 h-full w-full';
  @ViewChild('image') imageElement: ElementRef<HTMLImageElement> | undefined;

  imageUrl: string | ArrayBuffer | null = null;
  isAnHotdog: boolean | null = null;
  runningPrediction = false;
  // hotdogClassifier: mobilenet.MobileNet | undefined = undefined;
  latestPredictions: { className: string; probability: number }[] = [];

  ngOnInit() {
    // Load the model.
    // mobilenet.load().then((model) => {
    //   this.hotdogClassifier = model;
    //   console.log('Model loaded', this.hotdogClassifier);
    // });
  }

  onFileChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files) return;
    if (files.length === 0) return;

    const reader = new FileReader();
    reader.readAsDataURL(files[0]);
    reader.onload = (_event) => {
      // this.imageUrl = reader.result;
      // this.runningPrediction = true;
      // setTimeout(() => {
      //   this.classifyImage().then(() => {
      //     this.runningPrediction = false;
      //   });
      // }, 750);
    };
  }

  async classifyImage() {
    //   if (!this.hotdogClassifier) return;
    //   if (!this.imageElement) return;
    //   const predictions = await this.hotdogClassifier.classify(
    //     this.imageElement.nativeElement
    //   );
    //   this.latestPredictions = predictions;
    //   console.log(...predictions);
    //   const isAnHotdog = predictions.find((prediction) =>
    //     prediction.className.includes('hotdog')
    //   );
    //   this.isAnHotdog = isAnHotdog ? true : false;
  }
}
