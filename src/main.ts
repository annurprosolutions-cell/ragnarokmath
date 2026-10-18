import '@fontsource/fredoka/latin-400.css';
import '@fontsource/fredoka/latin-600.css';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { toast } from './ui/dom';

const updateSW = registerSW({
  onNeedRefresh() {
    toast('Versi baru tersedia. Memuat semula…', 'info');
    setTimeout(() => void updateSW(true), 1500);
  },
  onOfflineReady() {
    toast('✅ Game sedia dimain tanpa internet.', 'good');
  },
});

function boot(): void {
  const canvas = document.getElementById('scene') as HTMLCanvasElement;
  try {
    new App(canvas);
  } catch (err) {
    console.error(err);
    document.getElementById('ui')!.innerHTML = '<div class="screen fatal"><h2>Maaf 😢</h2><p>Peranti ini tidak menyokong grafik 3D (WebGL). Cuba buka dengan Chrome atau Safari terkini.</p></div>';
  }
  document.getElementById('boot')?.remove();
}

boot();
