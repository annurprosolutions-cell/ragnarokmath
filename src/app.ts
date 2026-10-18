// Screen flow: title → slots → (create) → game, and back.
import { setSound } from './audio/sfx';
import { Engine } from './game/engine';
import { GameSession } from './game/session';
import { SaveFile, loadSave, requestPersistence } from './save';
import { clear, uiRoot } from './ui/dom';
import { PreviewStage, ScreenActions, TitleStage, createCharacter, renderCreate, renderTitle } from './ui/screens';

export class App {
  private save: SaveFile;
  private engine: Engine;
  private title: TitleStage | null = null;
  private preview: PreviewStage | null = null;
  private actions: ScreenActions;

  constructor(canvas: HTMLCanvasElement) {
    this.save = loadSave();
    setSound(this.save.settings.sound);
    this.engine = new Engine(canvas, this.save.settings.quality);
    this.engine.onFrame((dt) => {
      this.title?.update(dt);
      this.preview?.update(dt);
    });
    this.actions = {
      play: (slot) => this.play(slot),
      create: (slot) => this.create(slot),
    };
    requestPersistence();
    this.showTitle('main');
  }

  private showTitle(view: 'main' | 'slots'): void {
    this.preview?.dispose();
    this.preview = null;
    if (!this.title) this.title = new TitleStage(this.engine, this.save);
    this.engine.scene = this.title.scene;
    document.body.dataset.screen = 'title';
    renderTitle(this.save, this.actions, view);
  }

  private create(slot: number): void {
    this.preview = new PreviewStage(this.engine);
    this.engine.scene = this.preview.scene;
    document.body.dataset.screen = 'create';
    renderCreate(this.preview, (name, grade, app) => {
      createCharacter(this.save, slot, name, grade, app);
      this.play(slot);
    }, () => this.showTitle('slots'));
  }

  private play(slot: number): void {
    this.preview?.dispose();
    this.preview = null;
    this.title?.dispose();
    this.title = null;
    clear(uiRoot());
    document.body.dataset.screen = 'game';
    const session = new GameSession(this.engine, this.save, slot, () => this.showTitle('slots'));
    // Handy for debugging and automated browser tests during development.
    if (import.meta.env.DEV) (window as unknown as { __session: GameSession }).__session = session;
  }
}
