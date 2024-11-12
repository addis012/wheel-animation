# Lottery Wheel Animation Package

A customizable lottery wheel animation system with sound effects.

## Features

- Interactive wheel animation with customizable themes
- Sound effects using Tone.js
- Configurable animation presets
- Mobile-responsive design

## Installation

1. Extract the ZIP contents to your project directory
2. Install dependencies:
   ```bash
   npm install
   ```

## File Structure

```
├── static/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── wheel.js
│       └── audio.js
└── templates/
    └── index.html
```

## Usage

1. Include the required files in your HTML:
   ```html
   <link href="/static/css/styles.css" rel="stylesheet">
   <script src="https://cdn.jsdelivr.net/npm/tone@15.0.4/build/Tone.min.js"></script>
   <script src="/static/js/audio.js"></script>
   <script src="/static/js/wheel.js"></script>
   ```

2. Add the wheel container to your HTML:
   ```html
   <div class="wheel-container">
       <div class="wheel-pointer"></div>
       <canvas id="wheelCanvas"></canvas>
       <button id="spinButton" class="btn btn-primary">SPIN</button>
   </div>
   ```

## Dependencies

- Bootstrap 5.3.0
- Tone.js 15.0.4
- Font Awesome 6.4.0

## License

MIT License
