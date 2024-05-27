import { Component, HostBinding } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HlmButtonModule } from '@spartan-ng/ui-button-helm';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterModule, HlmButtonModule],
  template: `
    <div class="h-full flex flex-col gap-5">
      <section class="flex flex-row items-center justify-between">
        <img src="assets/tcmmbay.svg" alt="logo" class="w-10 h-10" />
        <h2 class="text-2xl font-bold text-orange-600">
          TheAIBay - Webinar Demos
        </h2>
      </section>
      <div class="flex flex-row gap-5 justify-between">
        <img
          class="w-3/4 max-w-screen-lg h-auto max-h-[720px] object-cover rounded-lg shadow-lg"
          src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2h6cmpjanRyaml2eWJwcHBrOHdzaXl1ZWhhMjU5cG92NHVzdWV5YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5YqI5REP8hrorPwpev/giphy.gif"
        />
        <section class="w-1/4 flex flex-col gap-4">
          <a hlmBtn routerLink="/hotdog" class="btn">Hotdog Classifier</a>
          <a hlmBtn routerLink="/demo" class="btn">Meet</a>
        </section>
      </div>
    </div>
  `,
})
export class MenuPage {
  @HostBinding('class') class = 'flex-1 h-full w-full';
}
