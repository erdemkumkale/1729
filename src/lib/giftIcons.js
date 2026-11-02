// Gift icons: 36 filled silhouettes on a 24x24 grid, drawn for 1729.
// A gift card without a chosen icon gets one from its title and text (suggestIcon).

import React from 'react'

const ICONS = {
  pot: { mode: 'fill', sw: 1, svg: (<>
    <rect x="10.3" y="3.6" width="3.4" height="2.4" rx="1.2"/><rect x="5" y="6.3" width="14" height="2.4" rx="1.2"/>
    <path d="M5 10.2h14v5.8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/>
    <rect x="1.8" y="11.2" width="3" height="2.6" rx="1.3"/><rect x="19.2" y="11.2" width="3" height="2.6" rx="1.3"/></>) },
  key: { mode: 'fill', sw: 1, svg: (<>
    <path fillRule="evenodd" d="M6.6 6.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8zm0 3.4a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8z"/>
    <rect x="11" y="10.7" width="11" height="2.6" rx="1.3"/><rect x="15.6" y="12.6" width="2.4" height="3.8" rx="1.2"/><rect x="19.4" y="12.6" width="2.4" height="3.2" rx="1.2"/></>) },
  book: { mode: 'fill', sw: 1, svg: (<><path fillRule="evenodd" d="M7 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H7a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 7 3.5zM7.4 3.5h1.2v17H7.4zM11 8a.9.9 0 0 0 0 1.8h4.2a.9.9 0 0 0 0-1.8zm0 3.8a.9.9 0 0 0 0 1.8h2.6a.9.9 0 0 0 0-1.8z"/></>) },
  plant: { mode: 'fill', sw: 1, svg: (<>
    <path d="M7.2 15.5h9.6l-1 4.6a1.3 1.3 0 0 1-1.3 1H9.5a1.3 1.3 0 0 1-1.3-1z"/>
    <path d="M11.4 14.4C11.4 9.6 8.2 7.2 4 7.6 4 12 6.8 14.6 11.4 14.4z"/><path d="M12.6 12.6c0-4.6 2.8-7.8 7.4-7.8 0 4.6-2.8 7.8-7.4 7.8z"/></>) },
  chair: { mode: 'fill', sw: 1, svg: (<><rect x="6" y="3.5" width="12" height="9" rx="2.5"/><rect x="3.5" y="11.5" width="17" height="4.2" rx="2.1"/>
    <rect x="5" y="14.5" width="3" height="6.5" rx="1.5"/><rect x="16" y="14.5" width="3" height="6.5" rx="1.5"/></>) },
  hammer: { mode: 'fill', sw: 1, svg: (<>
    <path d="M3.5 5.5a2 2 0 0 1 2-2h9.8l3.2 1.6v4.8l-3.2 1.6H5.5a2 2 0 0 1-2-2z"/><rect x="9.4" y="10" width="3.6" height="11.5" rx="1.8"/></>) },
  shirt: { mode: 'fill', sw: 1, svg: (<><path d="M8.5 3.5 3 6.5l1.6 4 2.4-1V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5l2.4 1 1.6-4-5.5-3a3.5 3.5 0 0 1-7 0z"/></>) },
  toy: { mode: 'fill', sw: 1, svg: (<><circle cx="6.6" cy="6.6" r="2.7"/><circle cx="17.4" cy="6.6" r="2.7"/><path fillRule="evenodd" d="M12 7a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM9 12a1.1 1.1 0 1 0 2.2 0 1.1 1.1 0 1 0-2.2 0zM12.8 12a1.1 1.1 0 1 0 2.2 0 1.1 1.1 0 1 0-2.2 0zM10.6 15.6a1.4 1.1 0 1 0 2.8 0 1.4 1.1 0 1 0-2.8 0z"/></>) },
  bike: { mode: 'line', sw: 2.2, svg: (<><circle cx="5.5" cy="16" r="3.6"/><circle cx="18.5" cy="16" r="3.6"/><path d="M5.5 16 9.5 8.5h5.4l3.6 7.5M9.5 8.5l3.2 7.5h5.8M14.9 8.5l-.9-2.6h-2.3M8 8.5H6.6"/></>) },
  guitar: { mode: 'fill', sw: 1, svg: (<><g transform="rotate(40 12 12)"><rect x="11" y="1.8" width="2" height="9.4" rx="1"/><rect x="10.3" y="1.2" width="3.4" height="3" rx="1"/><path fillRule="evenodd" d="M12 8.6a3.4 3.4 0 0 0-3.2 4.5A4.7 4.7 0 1 0 12 21.7a4.7 4.7 0 0 0 3.2-8.6A3.4 3.4 0 0 0 12 8.6zM12 14.4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></g></>) },
  camera: { mode: 'fill', sw: 1, svg: (<><path fillRule="evenodd" d="M4.8 7H8l1.1-2.1a1 1 0 0 1 .9-.5h4a1 1 0 0 1 .9.5L16 7h3.2A2.3 2.3 0 0 1 21.5 9.3v8.4a2.3 2.3 0 0 1-2.3 2.3H4.8a2.3 2.3 0 0 1-2.3-2.3V9.3A2.3 2.3 0 0 1 4.8 7zM12 9.6a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4zm0 1.9a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z"/></>) },
  basket: { mode: 'fill', sw: 1, svg: (<><path d="M7 10.5a5 5 0 0 1 10 0" fill="none" strokeWidth="2"/><path fillRule="evenodd" d="M2.8 10.5h18.4l-1.9 8.6a1.8 1.8 0 0 1-1.8 1.4H6.5a1.8 1.8 0 0 1-1.8-1.4zM8.2 12.9v5.2h1.4v-5.2zm3.1 0v5.2h1.4v-5.2zm3.1 0v5.2h1.4v-5.2z"/></>) },
  hand: { mode: 'fill', sw: .3, svg: (<><rect x="5.4" y="6.4" width="2.6" height="9" rx="1.3"/><rect x="9" y="3.4" width="2.6" height="11" rx="1.3"/><rect x="12.6" y="2.8" width="2.6" height="11.6" rx="1.3"/><rect x="16.2" y="5.2" width="2.6" height="9.4" rx="1.3"/><path d="M5.4 12.8h13.4v3a5.2 5.2 0 0 1-5.2 5.2h-3a5.2 5.2 0 0 1-5.2-5.2z"/><rect x="1.8" y="11.4" width="3" height="7.4" rx="1.5" transform="rotate(-30 3.3 15)"/></>) },
  car: { mode: 'fill', sw: 1, svg: (<><path fillRule="evenodd" d="M4.2 11.2 5.9 7.6A2.4 2.4 0 0 1 8 6.2h8a2.4 2.4 0 0 1 2.1 1.4l1.7 3.6H20a2 2 0 0 1 2 2v3.1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3.1a2 2 0 0 1 2-2zM8.1 8.2l-1.3 3h4.2v-3zM13 8.2v3h4.2l-1.3-3z"/>
    <circle cx="7" cy="17.4" r="2.6"/><circle cx="17" cy="17.4" r="2.6"/></>) },
  box: { mode: 'fill', sw: 1, svg: (<><rect x="2.5" y="3.5" width="19" height="4.6" rx="1.4"/>
    <path fillRule="evenodd" d="M4 9.4h16V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19zM9.4 12.2a.9.9 0 0 0 0 1.8h5.2a.9.9 0 0 0 0-1.8z"/></>) },
  bottle: { mode: 'fill', sw: 1, svg: (<><rect x="10" y="2.4" width="4" height="3" rx="1.5"/><rect x="8.4" y="5.6" width="7.2" height="2" rx="1"/><path fillRule="evenodd" d="M9.9 8.4h4.2a2.4 2.4 0 0 1 2.4 2.4v8.4a2 2 0 0 1-2 2H9.5a2 2 0 0 1-2-2v-8.4a2.4 2.4 0 0 1 2.4-2.4zM10.2 11.4v1.4h3.6v-1.4zm0 3v1.4h3.6v-1.4z"/></>) },
  wrench: { mode: 'fill', sw: 1, svg: (<><g transform="rotate(45 12 12)"><rect x="10.6" y="9" width="2.8" height="12.5" rx="1.4"/><path d="M10.7 2.4A4.3 4.3 0 1 0 13.3 2.4V6.5H10.7z"/></g></>) },
  shovel: { mode: 'fill', sw: 1, svg: (<><g transform="rotate(25 12 12)"><rect x="8.8" y="1.8" width="6.4" height="2.4" rx="1.2"/><rect x="11.1" y="3.6" width="1.8" height="9" rx=".9"/><path d="M7.4 11.6h9.2v4.4c0 3.2-2.1 5.1-4.6 5.8-2.5-.7-4.6-2.6-4.6-5.8z"/></g></>) },
  utensils: { mode: 'fill', sw: 1, svg: (<><ellipse cx="7.6" cy="7.4" rx="3" ry="4"/><rect x="6.6" y="10.6" width="2" height="10.4" rx="1"/><rect x="13.6" y="2.6" width="1.3" height="5.2" rx=".65"/><rect x="15.4" y="2.6" width="1.3" height="5.2" rx=".65"/><rect x="17.2" y="2.6" width="1.3" height="5.2" rx=".65"/><path d="M13.6 7.4h4.9v1.8a2.5 2.5 0 0 1-1.5 2.3V20a1 1 0 0 1-2 0v-8.5a2.5 2.5 0 0 1-1.4-2.3z"/></>) },
  ear: { mode: 'line', sw: 2.2, svg: (<><path d="M6.4 10V9a5.8 5.8 0 0 1 11.6 0c0 2.6-2.2 3.6-3 5.2-.4.8-.3 1.6-.6 2.3a3.4 3.4 0 0 1-6.4-1.3"/><path d="M9.8 9.2a2.2 2.2 0 0 1 4.4 0"/></>) },
  cap: { mode: 'fill', sw: 1, svg: (<><path d="M12 3.4 1.8 9 12 14.6 22.2 9z"/><path d="M6 12.4v4.3c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.3L12 16.2z"/><rect x="20.2" y="9.8" width="1.7" height="6.2" rx=".85"/></>) },
  chat: { mode: 'fill', sw: 1, svg: (<>
    <path fillRule="evenodd" d="M5.2 4h13.6A2.2 2.2 0 0 1 21 6.2v8.6a2.2 2.2 0 0 1-2.2 2.2h-6.3L8 21v-4H5.2A2.2 2.2 0 0 1 3 14.8V6.2A2.2 2.2 0 0 1 5.2 4zM8.6 9.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm3.4 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm3.4 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"/></>) },
  note: { mode: 'fill', sw: 1, svg: (<><circle cx="7" cy="17.8" r="2.8"/><circle cx="17" cy="15.8" r="2.8"/><rect x="8" y="5.2" width="1.8" height="12.6" rx=".9"/><rect x="18" y="3.2" width="1.8" height="12.6" rx=".9"/><path d="M8 5.2 19.8 3.2v3.6L8 8.8z"/></>) },
  code: { mode: 'line', sw: 2.2, svg: (<><path d="M8 7 3 12l5 5M16 7l5 5-5 5M13.6 5 10.4 19"/></>) },
  pencil: { mode: 'fill', sw: 1, svg: (<><g transform="rotate(40 12 12)"><rect x="9" y="2.2" width="6" height="3.2" rx="1"/><rect x="9" y="6.6" width="6" height="8.4" rx=".6"/><path d="M9 16.2h6L12 21.8z"/></g></>) },
  nib: { mode: 'fill', sw: 1, svg: (<><path fillRule="evenodd" d="M12 2.4c2.8 3.2 5.2 6.6 5.4 10l-2 4.2H8.6l-2-4.2c.2-3.4 2.6-6.8 5.4-10zM12 9.9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11.4 13h1.2v3.6h-1.2z"/><rect x="8" y="18.2" width="8" height="2.8" rx="1.4"/></>) },
  calc: { mode: 'fill', sw: 1, svg: (<><path fillRule="evenodd" d="M7.5 2.5h9A2.5 2.5 0 0 1 19 5v14a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 19V5a2.5 2.5 0 0 1 2.5-2.5zM8 5.2v3.4h8V5.2zM9 11.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM9 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></>) },
  contract: { mode: 'fill', sw: 1, svg: (<><path fillRule="evenodd" d="M6.5 2.5H14l5 5v12a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM8 11h8v1.6H8zm0 3.4h8V16H8zm0 3.4h5v1.6H8z"/></>) },
  house: { mode: 'fill', sw: 1, svg: (<>
    <path d="M12 3.2 2.6 11.4h2.4v8.4a1 1 0 0 0 1 1h3.8v-5.6h4.4v5.6H18a1 1 0 0 0 1-1v-8.4h2.4z"/></>) },
  desk: { mode: 'fill', sw: 1, svg: (<><rect x="6.5" y="2.8" width="11" height="6.2" rx="1.4"/><rect x="2.5" y="10.2" width="19" height="3" rx="1.5"/><rect x="4.6" y="12" width="2.6" height="9" rx="1.3"/><rect x="16.8" y="12" width="2.6" height="9" rx="1.3"/></>) },
  parking: { mode: 'fill', sw: 1, svg: (<><path fillRule="evenodd" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM9.4 17.2h2V13.4h1.9a3.3 3.3 0 0 0 0-6.6H9.4zm2-8.5h1.7a1.4 1.4 0 0 1 0 2.8h-1.7z"/></>) },
  heart: { mode: 'fill', sw: 1, svg: (<><path d="M12 20.6C5.8 15.6 3.2 12.6 3.2 9.3A4.7 4.7 0 0 1 7.9 4.6c1.8 0 3.3.9 4.1 2.4.8-1.5 2.3-2.4 4.1-2.4a4.7 4.7 0 0 1 4.7 4.7c0 3.3-2.6 6.3-8.8 11.3z"/></>) },
  support: { mode: 'fill', sw: 1, svg: (<><path fillRule="evenodd" d="M5.2 4h13.6A2.2 2.2 0 0 1 21 6.2v8.6a2.2 2.2 0 0 1-2.2 2.2h-6.3L8 21v-4H5.2A2.2 2.2 0 0 1 3 14.8V6.2A2.2 2.2 0 0 1 5.2 4zM12 14.2c-2.8-2-4-3.2-4-4.6a2 2 0 0 1 4-.7 2 2 0 0 1 4 .7c0 1.4-1.2 2.6-4 4.6z"/></>) },
  cup: { mode: 'fill', sw: 1, svg: (<>
    <path d="M4.5 8.6h11v5.2a4.6 4.6 0 0 1-4.6 4.6H9.1a4.6 4.6 0 0 1-4.6-4.6z"/>
    <path fillRule="evenodd" d="M15.5 9.8h1.6a3.3 3.3 0 0 1 0 6.6h-2.2v-1.9h2.2a1.4 1.4 0 0 0 0-2.8h-1.6z"/>
    <rect x="3" y="19.8" width="14" height="1.8" rx=".9"/></>) },
  gift: { mode: 'fill', sw: 1, svg: (<>
    <path fillRule="evenodd" d="M4 8h16a1 1 0 0 1 1 1v2.6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zm1 5.6h14v6a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 19.6zM11.2 8h1.6v13.2h-1.6z"/>
    <path d="M12 7.8C9.2 7.8 6.8 7 6.8 5.2S9 3 10.6 4.2C11.8 5.1 12 7.8 12 7.8z"/><path d="M12 7.8c2.8 0 5.2-.8 5.2-2.6S15 3 13.4 4.2C12.2 5.1 12 7.8 12 7.8z"/></>) },
  other: { mode: 'raw', svg: (<><mask id="qm"><rect width="24" height="24" fill="#fff"/><path d="M9.1 9.4a2.9 2.9 0 1 1 4.5 2.4c-1 .7-1.6 1.2-1.6 2.4" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/><circle cx="12" cy="17.3" r="1.3" fill="#000"/></mask><circle cx="12" cy="12" r="9.5" fill="currentColor" mask="url(#qm)"/></>) },
}

export const GIFT_ICON_IDS = ["pot", "key", "book", "plant", "chair", "hammer", "shirt", "toy", "bike", "guitar", "camera", "basket", "hand", "car", "box", "bottle", "wrench", "shovel", "utensils", "ear", "cap", "chat", "note", "code", "pencil", "nib", "calc", "contract", "house", "desk", "parking", "heart", "support", "cup", "gift", "other"]

export const GIFT_ICON_LABELS = {
  tr: {"pot": "Tencere", "key": "Anahtar", "book": "Kitap", "plant": "Bitki", "chair": "Sandalye", "hammer": "Alet", "shirt": "Kıyafet", "toy": "Oyuncak", "bike": "Bisiklet", "guitar": "Müzik aleti", "camera": "Kamera", "basket": "Sepet", "hand": "El yardımı", "car": "Yolculuk", "box": "Taşınma", "bottle": "Çocuk", "wrench": "Tamir", "shovel": "Bahçe", "utensils": "Mutfak", "ear": "Dinlemek", "cap": "Ders", "chat": "Dil", "note": "Müzik", "code": "Kod", "pencil": "Yazı", "nib": "Tasarım", "calc": "Hesap", "contract": "Sözleşme", "house": "Oda", "desk": "Çalışma alanı", "parking": "Park yeri", "heart": "İyi oluş", "support": "Destek", "cup": "Çay", "gift": "Genel", "other": "Başka"},
  en: {"pot": "Pot", "key": "Key", "book": "Book", "plant": "Plant", "chair": "Chair", "hammer": "Tool", "shirt": "Clothes", "toy": "Toy", "bike": "Bike", "guitar": "Instrument", "camera": "Camera", "basket": "Basket", "hand": "Help", "car": "Ride", "box": "Moving", "bottle": "Child", "wrench": "Repair", "shovel": "Garden", "utensils": "Kitchen", "ear": "Listening", "cap": "Lesson", "chat": "Language", "note": "Music", "code": "Code", "pencil": "Writing", "nib": "Design", "calc": "Numbers", "contract": "Contract", "house": "Room", "desk": "Workspace", "parking": "Parking", "heart": "Wellbeing", "support": "Support", "cup": "Tea", "gift": "General", "other": "Other"},
}

// Word-start phrases, lower case; the longest matching phrase wins.
const KEYWORDS = {"pot": ["tencere", "çaydanlık", "çorba", "tava", "pot", "pan", "stew", "saucepan"], "key": ["anahtar", "key"], "book": ["kitap", "roman", "dergi", "book", "novel", "magazine"], "plant": ["bitki", "çiçek", "fidan", "saksı", "plant", "flower", "seedling"], "chair": ["sandalye", "koltuk", "mobilya", "kanepe", "chair", "armchair", "sofa", "furniture"], "hammer": ["çekiç", "alet", "matkap", "hammer", "drill", "tool"], "shirt": ["kıyafet", "elbise", "mont", "ceket", "gömlek", "tişört", "pantolon", "giysi", "shirt", "jacket", "coat", "clothes", "dress"], "toy": ["oyuncak", "peluş", "lego", "toy", "teddy", "plush"], "bike": ["bisiklet", "scooter", "bike", "bicycle"], "guitar": ["gitar", "keman", "ukulele", "piyano", "davul", "flüt", "guitar", "violin", "piano", "drum", "flute", "instrument"], "camera": ["kamera", "fotoğraf", "camera", "photo"], "basket": ["sepet", "piknik", "basket", "picnic"], "hand": ["yardım", "el desteği", "hand", "help"], "car": ["araba", "yolculuk", "otomobil", "araç", "car", "ride", "lift", "drive"], "box": ["taşın", "taşı", "koli", "nakliye", "moving", "move", "boxes"], "bottle": ["bebek", "çocuk", "biberon", "baby", "child", "babysit", "kid"], "wrench": ["tamir", "onarım", "tesisat", "repair", "fix", "plumbing"], "shovel": ["bahçe", "kürek", "toprak", "garden", "shovel", "dig"], "utensils": ["mutfak", "tarif", "aşçı", "kaşık", "kurabiye", "pasta", "yemek", "cooking", "kitchen", "recipe", "meal", "food", "bake"], "ear": ["dinle", "sohbet", "kulak", "listen", "ear", "chat with"], "cap": ["ders", "eğitim", "öğretim", "kurs", "mentor", "okul", "lesson", "teach", "course", "class", "tutor"], "chat": ["ingilizce", "almanca", "fransızca", "ispanyolca", "çeviri", "konuşma", "language", "english", "german", "french", "spanish", "translat", "speaking"], "note": ["müzik", "şarkı", "nota", "koro", "music", "song", "sing"], "code": ["yazılım", "kod", "web", "programlama", "code", "software", "program"], "pencil": ["yazı", "yazmak", "kalem", "edebiyat", "makale", "write", "writing", "essay", "edit"], "nib": ["tasarım", "logo", "grafik", "çizim", "illüstrasyon", "design", "graphic", "draw", "illustration"], "calc": ["hesap", "muhasebe", "matematik", "vergi", "bütçe", "finans", "math", "accounting", "tax", "budget", "finance"], "contract": ["sözleşme", "hukuk", "belge", "dilekçe", "evrak", "contract", "legal", "document", "law"], "house": ["oda", "misafir", "konaklama", "kalacak yer", "room", "couch", "stay", "accommodation"], "desk": ["çalışma alanı", "masa", "ofis", "desk", "office", "coworking", "workspace"], "parking": ["otopark", "garaj", "park yeri", "parking", "garage"], "heart": ["yoga", "meditasyon", "nefes", "masaj", "sağlık", "gevşeme", "wellbeing", "meditation", "massage", "health", "relax"], "support": ["danışma", "psikolojik", "terapi", "destek", "koçluk", "therapy", "counsel", "support", "coaching", "psycholog"], "cup": ["çay", "kahve", "fincan", "tea", "coffee", "cup"], "gift": [], "other": []}

// Broad words that should lose against a more specific one ("yoga dersi" is wellbeing, not a lesson).
const GENERIC = new Set(['ders', 'eğitim', 'kurs', 'okul', 'yardım', 'destek', 'konuşma', 'help', 'support', 'lesson', 'class', 'course', 'teach', 'speaking', 'tool', 'alet', 'web', 'kod', 'code'])
// Short English words must match as whole words ("tea" must not match "teaching").
const WHOLE = new Set(['tea', 'pot', 'pan', 'car', 'key', 'kid', 'ear', 'toy', 'fix', 'ride', 'lift', 'move', 'edit', 'sing', 'song', 'bike', 'law', 'tax', 'web', 'draw', 'dig', 'stay', 'room', 'help', 'food', 'bake', 'meal', 'math', 'tool', 'class', 'code', 'baby', 'cup', 'book', 'drum', 'dress', 'coat'])
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const MATCHERS = Object.entries(KEYWORDS).flatMap(([id, words]) =>
  words.map((w) => ({ id, len: GENERIC.has(w) ? w.length - 3 : w.length, re: new RegExp(`(^|[^\\p{L}])${esc(w)}${WHOLE.has(w) ? '(s|es|ed|ing)?(?![\\p{L}])' : ''}`, 'u') }))
)

// Picks an icon id for the words a member wrote; the generic gift icon when nothing fits.
export const suggestIcon = (text) => {
  const s = (text || '').toLocaleLowerCase('tr')
  if (!s.trim()) return 'gift'
  let best = null
  for (const m of MATCHERS) {
    if (m.re.test(s) && (!best || m.len > best.len)) best = m
  }
  return best ? best.id : 'gift'
}

export const GiftIcon = ({ id, size = 24, style }) => {
  const def = ICONS[id] || ICONS.gift
  const box = { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': true, style: { display: 'block', ...style } }
  if (def.mode === 'raw') return <svg {...box} fill="currentColor">{def.svg}</svg>
  const props = def.mode === 'line'
    ? { fill: 'none', stroke: 'currentColor', strokeWidth: def.sw, strokeLinecap: 'round', strokeLinejoin: 'round' }
    : { fill: 'currentColor', stroke: 'currentColor', strokeWidth: def.sw, strokeLinejoin: 'round' }
  return <svg {...box}><g {...props}>{def.svg}</g></svg>
}
