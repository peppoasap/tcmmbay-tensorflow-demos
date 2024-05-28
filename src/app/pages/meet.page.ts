import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Signal,
  ViewChild,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HlmCardContentDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardDescriptionDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardFooterDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardHeaderDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardTitleDirective } from '@spartan-ng/ui-card-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmIconComponent } from '../../../libs/ui/ui-icon-helm/src/lib/hlm-icon.component';
import { HlmButtonModule } from '@spartan-ng/ui-button-helm';
import { provideIcons } from '@spartan-ng/ui-icon-helm';
import { lucideChevronLeft, lucideXCircle } from '@ng-icons/lucide';
import { WebcamComponent, WebcamModule, WebcamUtil } from 'ngx-webcam';
import {
  HlmTabsComponent,
  HlmTabsContentDirective,
  HlmTabsListComponent,
  HlmTabsTriggerDirective,
} from '@spartan-ng/ui-tabs-helm';
import { AIBuilder, AIChain } from '../services/ai/ai-chain.service';
import {
  FacemeshPrediction,
  FacemeshService,
} from '../services/ai/facemesh.service';
import { BehaviorSubject, animationFrameScheduler, interval } from 'rxjs';
import {
  AIBasePrediction,
  Point,
} from '../services/ai/AIBaseService.interface';
import {
  SegmenterPrediction,
  SegmenterService,
} from '../services/ai/segmenter.service';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-meet',
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
    RouterLink,
  ],
  providers: [provideIcons({ lucideChevronLeft, lucideXCircle })],
  template: `
    <div class="h-full overflow-hidden flex flex-col gap-4">
      <section hlmCard class="flex flex-row items-center justify-between">
        <div hlmCardHeader class="flex flex-row gap-2 items-center">
          <button hlmBtn size="icon" variant="outline" routerLink="../">
            <hlm-icon size="lg" name="lucideChevronLeft" />
          </button>
          <img src="assets/tcmmbay.svg" alt="logo" class="w-10 h-10" />
          <div class="flex flex-col">
            <h3 hlmCardTitle>MeetBay</h3>
            <p hlmCardDescription>
              AI in app Angular con Tensorflow.js e i Web Worker
            </p>
          </div>
        </div>
        <div
          hlmCardContent
          class="flex flex-row gap-4 justify-center items-center pb-0"
        >
          <div class="flex flex-col items-end">
            <a
              class="text-lg font-semibold text-red-500"
              href="https://ngrome.io"
              >www.ngrome.io</a
            >
            <b class="text-red-600 underline underline-offset-2"
              >THECMMBAY-10</b
            >
          </div>
          <img src="assets/ngrome.png" alt="logo" class="w-12 h-12" />
        </div>
      </section>

      <section
        hlmCard
        class="h-[calc(100%-110px)] flex flex-row gap-5 items-start justify-start"
      >
        <div hlmCardContent class="h-full flex flex-col w-9/12 pt-5 relative">
          <webcam
            #webcam
            class="w-full h-full flex-1 rounded-md opacity-70"
            [allowCameraSwitch]="false"
            mirrorImage="always"
          ></webcam>
          <canvas
            #drawLayer
            class="absolute top-0 left-0 p-5 w-full z-10 scale-x-[-1] object-cover max-h-full rounded-[32px] border-dotted
              border-red-600"
          ></canvas>
          <div
            class="flex-auto flex flex-row gap-5 items-center justify-between"
          ></div>
        </div>
        <div hlmCardFooter class="w-3/12 h-full flex flex-col py-5 pl-0 pr-5">
          <hlm-tabs tab="effects" class="block w-full">
            <hlm-tabs-list
              class="w-full grid grid-cols-2"
              aria-label="tabs example"
            >
              <button hlmTabsTrigger="effects">Effects</button>
              <button hlmTabsTrigger="backgrounds">Backgrounds</button>
            </hlm-tabs-list>

            <div hlmTabsContent="effects">
              <div class="grid grid-flow-row grid-cols-2 row-auto gap-2">
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2 hover:bg-gray-200 hover:cursor-pointer"
                  (click)="selectedEffect.set(null)"
                  [class.bg-orange-200]="!selectedEffect()"
                >
                  <hlm-icon size="lg" name="lucideXCircle" />
                  None
                </div>
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2"
                  (click)="selectedEffect.set('assets/effects/moustache.png')"
                  [class.bg-orange-200]="
                    selectedEffect() === 'assets/effects/moustache.png'
                  "
                >
                  <img
                    src="assets/effects/moustache.png"
                    alt="moustache"
                    class="max-h-16"
                  />
                  Moustache
                </div>
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2"
                  (click)="selectedEffect.set('assets/effects/cap.png')"
                  [class.bg-orange-200]="
                    selectedEffect() === 'assets/effects/cap.png'
                  "
                >
                  <img
                    src="assets/effects/cap.png"
                    alt="dog"
                    class="max-h-16"
                  />
                  Cap
                </div>
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2"
                  (click)="selectedEffect.set('assets/effects/sponge.png')"
                  [class.bg-orange-200]="
                    selectedEffect() === 'assets/effects/sponge.png'
                  "
                >
                  <img
                    src="assets/effects/sponge.png"
                    alt="sponge"
                    class="max-h-16"
                  />
                  Sponge
                </div>
              </div>
            </div>
            <div hlmTabsContent="backgrounds">
              <div class="grid grid-flow-row grid-cols-2 row-auto gap-1">
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2 hover:bg-gray-200 hover:cursor-pointer"
                  (click)="selectedBackground.set(null)"
                  [class.bg-orange-200]="!selectedBackground()"
                >
                  <hlm-icon size="lg" name="lucideXCircle" />
                  None
                </div>
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2"
                  (click)="
                    selectedBackground.set('assets/backgrounds/windows.jpeg')
                  "
                  [class.bg-orange-200]="
                    selectedBackground() === 'assets/backgrounds/windows.jpeg'
                  "
                >
                  <img
                    src="assets/backgrounds/windows.jpeg"
                    alt="windows"
                    class="max-h-16"
                  />
                  Windows
                </div>
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2"
                  (click)="
                    selectedBackground.set('assets/backgrounds/villa.jpg')
                  "
                  [class.bg-orange-200]="
                    selectedBackground() === 'assets/backgrounds/villa.jpg'
                  "
                >
                  <img
                    src="assets/backgrounds/villa.jpg"
                    alt="villa"
                    class="max-h-16"
                  />
                  Villa
                </div>
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2"
                  (click)="
                    selectedBackground.set('assets/backgrounds/spongebob.webp')
                  "
                  [class.bg-orange-200]="
                    selectedBackground() === 'assets/backgrounds/spongebob.webp'
                  "
                >
                  <img
                    src="assets/backgrounds/spongebob.webp"
                    alt="spongebob"
                    class="max-h-16"
                  />
                  Spongebob
                </div>
                <div
                  class="bg-muted rounded-md min-h-32 flex flex-col justify-center items-center gap-2"
                  (click)="
                    selectedBackground.set('assets/backgrounds/meme.jpeg')
                  "
                  [class.bg-orange-200]="
                    selectedBackground() === 'assets/backgrounds/meme.jpeg'
                  "
                >
                  <img
                    src="assets/backgrounds/meme.jpeg"
                    alt="meme"
                    class="max-h-16"
                  />
                  Meme
                </div>
              </div>
            </div>
            <canvas
              #debugLayer
              class="w-full z-10 scale-x-[-1] object-contain max-h-full mt-5 rounded-md border-dotted
              border-red-600"
              [class.border-2]="canDraw"
            ></canvas>
          </hlm-tabs>
        </div>
      </section>
    </div>
  `,
})
export class MeetPage implements AfterViewInit {
  @HostBinding('class') class = 'flex-1 h-full w-full';
  @ViewChild('webcam') webcam: WebcamComponent | undefined;
  @ViewChild('drawLayer') drawLayer: ElementRef<HTMLCanvasElement> | undefined;
  @ViewChild('debugLayer') debugLayer:
    | ElementRef<HTMLCanvasElement>
    | undefined;

  builder = inject(AIBuilder);

  ai!: AIChain;
  FPS = 15;
  canDraw = false;

  selectedEffect: WritableSignal<string | null> = signal(null);
  effect = computed(() => {
    const image = new Image();
    image.src = this.selectedEffect() || '';
    return image;
  });

  selectedBackground: WritableSignal<string | null> = signal(null);
  background = computed(() => {
    const image = new Image();
    image.src = this.selectedBackground() || '';
    return image;
  });

  ngOnInit() {}

  ngAfterViewInit() {
    this.builder
      .createChain([new FacemeshService(), new SegmenterService()])
      .subscribe({
        next: (chain) => {
          this.ai = chain;
          this.ai.isReady.subscribe({
            next: (ready) => {
              if (ready) {
                this.activeFilters();
              }
            },
          });
        },
      });
  }

  activeFilters() {
    this.canDraw = true;
    const input = this.webcam?.nativeVideoElement as HTMLVideoElement;
    interval(1000 / this.FPS).subscribe(() => {
      this.ai.predict(input);
    });
    this.readPredictedData();
    // animationFrameScheduler.schedule(() => {
    //   this.ai.predict(input);
    // }, 1000 / this.FPS);
  }

  readPredictedData() {
    const input = this.webcam?.nativeVideoElement as HTMLVideoElement;
    const drawCanvas = this.drawLayer?.nativeElement as HTMLCanvasElement;
    drawCanvas.width = input.videoWidth;
    drawCanvas.height = input.videoHeight;
    const debugCanvas = this.debugLayer?.nativeElement as HTMLCanvasElement;
    debugCanvas.width = input.videoWidth;
    debugCanvas.height = input.videoHeight;
    const ctx = drawCanvas.getContext('2d');

    this.ai.handle().subscribe({
      next: (data) => {
        this.ai.draw(debugCanvas, input);
        if (!ctx) return;
        ctx.save();
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        ctx.drawImage(input, 0, 0, input.width, input.height);
        let segmenterPredictions: AIBasePrediction<SegmenterPrediction> =
          data.get('segmenter')![0];
        if (
          segmenterPredictions.data.length !== 0 &&
          this.selectedBackground()
        ) {
          this.applyBackground(drawCanvas, segmenterPredictions.data[0]);
        }
        let facemeshPredictions: AIBasePrediction<FacemeshPrediction> =
          data.get('facemesh')![0];
        if (facemeshPredictions.data.length !== 0 && this.selectedEffect()) {
          this.applyEffect(drawCanvas, facemeshPredictions.data[0]);
        }
        ctx.restore();
      },
    });
  }

  applyBackground(canvas: HTMLCanvasElement, prediction: SegmenterPrediction) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const maskCanvas = new OffscreenCanvas(
      prediction.mask.width,
      prediction.mask.height
    );
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
      return;
    }
    maskCtx.putImageData(prediction.mask, 0, 0);
    ctx.drawImage(this.background(), 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
  }

  applyEffect(canvas: HTMLCanvasElement, prediction: FacemeshPrediction) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const leftEye = prediction.annotations.leftEyeLower2;
    const rightEye = prediction.annotations.rightEyeLower2;
    const nose = prediction.annotations.noseTip;
    const moustache = prediction.annotations.moustache;
    const lips = prediction.annotations.lipsUpperOuter;
    const silhouette = prediction.annotations.silhouette;

    switch (this.selectedEffect()) {
      case 'assets/effects/moustache.png':
        this.drawMoustache(ctx, moustache, lips);
        break;
      case 'assets/effects/cap.png':
        this.drawCapFilter(ctx, silhouette, nose);
        break;
      case 'assets/effects/sponge.png':
        this.drawSpongeFilter(ctx, silhouette, leftEye, rightEye, nose);
        break;
    }
  }

  drawMoustache(
    ctx: CanvasRenderingContext2D,
    moustache: Point[],
    lips: Point[]
  ) {
    const imageWidth =
      Math.abs(moustache[0].x - moustache[moustache.length - 1].x) + 20;
    const imageHeight = Math.abs(lips[5].y - moustache[1].y) + 20;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(
      this.effect(),
      moustache[0].x - 10,
      moustache[1].y - imageHeight / 2,
      imageWidth,
      imageHeight
    );
  }

  drawCapFilter(
    ctx: CanvasRenderingContext2D,
    silhouette: Point[],
    nose: Point[]
  ) {
    const rightUpper = silhouette[4];
    const leftUpper = silhouette[32];
    const rightLower = silhouette[13];
    const leftLower = silhouette[23];
    const imageWidth = Math.abs(rightUpper.x - leftUpper.x) * 2;
    const imageHeight = 180;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(
      this.effect(),
      nose[0].x - imageWidth / 2 - 25,
      rightUpper.y - imageHeight,
      imageWidth,
      imageHeight
    );
  }

  drawSpongeFilter(
    ctx: CanvasRenderingContext2D,
    silhouette: Point[],
    leftEye: Point[],
    rightEye: Point[],
    nose: Point[]
  ) {
    const rightUpper = silhouette[4];
    const leftUpper = silhouette[32];
    const rightLower = silhouette[13];
    const leftLower = silhouette[23];
    const imageWidth = Math.abs(rightUpper.x - leftUpper.x) * 2;
    const imageHeight = Math.abs(rightUpper.y - rightLower.y) * 1.3;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(
      this.effect(),
      leftEye[0].x - imageWidth / 2 - 40,
      leftEye[0].y - imageHeight / 2 + 20,
      imageWidth,
      imageHeight
    );
  }
}
