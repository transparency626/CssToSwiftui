# CSS to SwiftUI / UIKit

Select any element on a web page to generate **SwiftUI** and **UIKit** code; copy and use in Xcode.

## Installation

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**, then select this folder `CSS-to-SwiftUI`

## Usage

1. Open any web page
2. Click the extension icon in the browser toolbar
3. The page enters **pick mode**: hovering highlights the current element; **click** the area you want to convert
4. A panel shows **SwiftUI** and **UIKit** code for that element; use the copy button to copy to clipboard

## Files

- `converter.js`: Core conversion (CSS/computed style → SwiftUI and UIKit strings)
- `content.js`: Element selection, highlight, panel, copy
- `background.js`: Responds to extension icon click, sends "start pick" message to the current page
- `manifest.json`: Extension config

## Notes

- Conversion is based on **computed style** and **DOM structure**; it infers VStack/HStack, padding, colors, fonts, corner radius, etc.
- Complex layouts or deep nesting may need minor tweaks in Xcode.
- Depth is limited to 6 levels to avoid overly long generated code.
