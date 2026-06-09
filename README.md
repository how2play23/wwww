# Arena AI Desktop

Десктоп-приложение для [Arena AI](https://arena.ai/) — удобная обёртка вместо браузера.

## Возможности

- Полноценный доступ к arena.ai в отдельном окне
- Панель навигации: назад, вперёд, обновить, главная
- Индикатор загрузки и адресная строка
- Горячие клавиши: `Ctrl+R`, `F5`, `Alt+←`, `Alt+→`
- Внешние ссылки открываются в системном браузере

## Установка готового приложения

Скачайте файл из папки `dist/` после сборки или из релиза:

| Файл | Платформа |
|------|-----------|
| `Arena AI-*.AppImage` | Linux (универсальный, без установки) |
| `arena-ai-desktop_*_amd64.deb` | Linux (Debian/Ubuntu) |

### Linux — AppImage

```bash
chmod +x "Arena AI-1.0.0.AppImage"
./"Arena AI-1.0.0.AppImage"
```

### Linux — deb

```bash
sudo dpkg -i arena-ai-desktop_1.0.0_amd64.deb
```

## Запуск из исходников

```bash
npm install
npm start
```

## Сборка

```bash
npm install
npm run build
```

Готовые установщики появятся в папке `dist/`.
