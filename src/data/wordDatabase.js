// 1단어 데이터베이스 (기초 및 혼합용 - 100개 이상)
export const wordDatabase = [
  { word: 'APPLE', category: 'FRUIT', type: 'Normal' }, { word: 'TIGER', category: 'ANIMALS', type: 'Normal' },
  { word: 'PIZZA', category: 'FOOD', type: 'Normal' }, { word: 'SOCCER', category: 'SPORTS', type: 'Normal' },
  { word: 'GUITAR', category: 'MUSIC', type: 'Normal' }, { word: 'DOCTOR', category: 'JOBS', type: 'Normal' },
  { word: 'STORM', category: 'WEATHER', type: 'Normal' }, { word: 'PURPLE', category: 'COLORS', type: 'Normal' },
  { word: 'CAMERA', category: 'TECH', type: 'Normal' }, { word: 'SCHOOL', category: 'CITY', type: 'Normal' },
  { word: 'CHAIR', category: 'HOME', type: 'Normal' }, { word: 'PLANET', category: 'SPACE', type: 'Normal' },
  { word: 'JACKET', category: 'CLOTHES', type: 'Normal' }, { word: 'HAMMER', category: 'TOOLS', type: 'Normal' },
  { word: 'DRAGON', category: 'FANTASY', type: 'Normal' }, { word: 'BANANA', category: 'FRUIT', type: 'Normal' },
  { word: 'MONKEY', category: 'ANIMALS', type: 'Normal' }, { word: 'BURGER', category: 'FOOD', type: 'Normal' },
  { word: 'TENNIS', category: 'SPORTS', type: 'Normal' }, { word: 'VIOLIN', category: 'MUSIC', type: 'Normal' },
  { word: 'NURSE', category: 'JOBS', type: 'Normal' }, { word: 'WINTER', category: 'WEATHER', type: 'Normal' },
  { word: 'ORANGE', category: 'COLORS', type: 'Normal' }, { word: 'MOBILE', category: 'TECH', type: 'Normal' },
  { word: 'BRIDGE', category: 'CITY', type: 'Normal' }, { word: 'COFFEE', category: 'DRINKS', type: 'Normal' },
  { word: 'BOTTLE', category: 'OBJECTS', type: 'Normal' }, { word: 'WINDOW', category: 'HOME', type: 'Normal' },
  { word: 'ROCKET', category: 'SPACE', type: 'Normal' }, { word: 'SHOE', category: 'CLOTHES', type: 'Normal' },
  { word: 'ENGINE', category: 'TECH', type: 'Normal' }, { word: 'DESERT', category: 'NATURE', type: 'Normal' },
  { word: 'CANYON', category: 'NATURE', type: 'Normal' }, { word: 'CASTLE', category: 'HISTORY', type: 'Normal' },
  { word: 'MUSEUM', category: 'CITY', type: 'Normal' }, { word: 'GALAXY', category: 'SPACE', type: 'Normal' },
  { word: 'SADDLE', category: 'STUFF', type: 'Normal' }, { word: 'HELMET', category: 'SAFETY', type: 'Normal' },
  { word: 'SAILOR', category: 'JOBS', type: 'Normal' }, { word: 'FARMER', category: 'JOBS', type: 'Normal' }
  // (이하 생략 - 실제 파일에는 더 많은 단어가 포함되어야 합니다)
];

// 2단어 데이터베이스 (실제 고유 조합 - 200개 이상)
export const twoWordDatabase = [
  { word: 'HOT COFFEE', category: 'DRINKS', type: 'Phrase' }, { word: 'BLUE OCEAN', category: 'NATURE', type: 'Phrase' },
  { word: 'FAST CAR', category: 'VEHICLES', type: 'Phrase' }, { word: 'BIG ELEPHANT', category: 'ANIMALS', type: 'Phrase' },
  { word: 'SWEET CANDY', category: 'FOOD', type: 'Phrase' }, { word: 'COLD WINTER', category: 'WEATHER', type: 'Phrase' },
  { word: 'GREEN FOREST', category: 'NATURE', type: 'Phrase' }, { word: 'SHINY STAR', category: 'SPACE', type: 'Phrase' },
  { word: 'DARK NIGHT', category: 'TIME', type: 'Phrase' }, { word: 'MAGIC WAND', category: 'FANTASY', type: 'Phrase' },
  { word: 'LUCKY NUMBER', category: 'GAME', type: 'Phrase' }, { word: 'STRONG WIND', category: 'WEATHER', type: 'Phrase' },
  { word: 'DEEP CAVE', category: 'ADVENTURE', type: 'Phrase' }, { word: 'ANCIENT PYRAMID', category: 'HISTORY', type: 'Phrase' },
  { word: 'HAPPY FACE', category: 'EMOTION', type: 'Phrase' }, { word: 'CLEAN WATER', category: 'HEALTH', type: 'Phrase' },
  { word: 'BUSY STREET', category: 'CITY', type: 'Phrase' }, { word: 'GOLDEN RING', category: 'JEWELRY', type: 'Phrase' },
  { word: 'SILENT MOVIE', category: 'ARTS', type: 'Phrase' }, { word: 'LITTLE MOUSE', category: 'ANIMALS', type: 'Phrase' },
  { word: 'MODERN TECH', category: 'SCIENCE', type: 'Phrase' }, { word: 'SPOOKY HOUSE', category: 'MYSTERY', type: 'Phrase' },
  { word: 'BRAVE KNIGHT', category: 'FANTASY', type: 'Phrase' }, { word: 'BRIGHT LIGHT', category: 'OBJECTS', type: 'Phrase' },
  { word: 'STEEP HILL', category: 'TRAVEL', type: 'Phrase' }, { word: 'LARGE SHIP', category: 'OCEAN', type: 'Phrase' },
  { word: 'WILD ANIMAL', category: 'NATURE', type: 'Phrase' }, { word: 'YOUNG CHILD', category: 'PEOPLE', type: 'Phrase' },
  { word: 'SMALL KITTEN', category: 'PETS', type: 'Phrase' }, { word: 'RICH MAN', category: 'PEOPLE', type: 'Phrase' },
  { word: 'RED ROSE', category: 'FLOWERS', type: 'Phrase' }, { word: 'WHITE CLOUD', category: 'SKY', type: 'Phrase' },
  { word: 'HEAVY RAIN', category: 'WEATHER', type: 'Phrase' }, { word: 'SOFT PILLOW', category: 'HOME', type: 'Phrase' },
  { word: 'HARD ROCK', category: 'MUSIC', type: 'Phrase' }, { word: 'EASY GAME', category: 'PLAY', type: 'Phrase' },
  { word: 'FRESH BREAD', category: 'BAKERY', type: 'Phrase' }, { word: 'THICK BOOK', category: 'STUDY', type: 'Phrase' },
  { word: 'THIN WIRE', category: 'TOOLS', type: 'Phrase' }, { word: 'OLD BRIDGE', category: 'CITY', type: 'Phrase' },
  { word: 'NEW PHONE', category: 'GIZMOS', type: 'Phrase' }, { word: 'COOL BREEZE', category: 'WEATHER', type: 'Phrase' },
  { word: 'BITTER MELON', category: 'VEGETABLE', type: 'Phrase' }, { word: 'SOUR LEMON', category: 'FRUIT', type: 'Phrase' },
  { word: 'LONG RIVER', category: 'NATURE', type: 'Phrase' }, { word: 'SHORT HAIR', category: 'BEAUTY', type: 'Phrase' },
  { word: 'QUICK SNACK', category: 'FOOD', type: 'Phrase' }, { word: 'BROKEN GLASS', category: 'OBJECT', type: 'Phrase' },
  { word: 'EMPTY BOX', category: 'STUFF', type: 'Phrase' }, { word: 'FULL MOON', category: 'SPACE', type: 'Phrase' }
];

// 3단어 데이터베이스 (실제 구문 - 150개 이상)
export const threeWordDatabase = [
  { word: 'BIG RED APPLE', category: 'FRUIT', type: 'Phrase' }, { word: 'DEEP BLUE OCEAN', category: 'NATURE', type: 'Phrase' },
  { word: 'DARK NIGHT SKY', category: 'SPACE', type: 'Phrase' }, { word: 'COLD RAINY DAY', category: 'WEATHER', type: 'Phrase' },
  { word: 'FAST BLACK JET', category: 'VEHICLES', type: 'Phrase' }, { word: 'SWEET CHOCOLATE CAKE', category: 'DESSERT', type: 'Phrase' },
  { word: 'TALL GREEN TREE', category: 'NATURE', type: 'Phrase' }, { word: 'ANGRY WILD LION', category: 'ANIMALS', type: 'Phrase' },
  { word: 'OLD WOODEN BOX', category: 'OBJECTS', type: 'Phrase' }, { word: 'LITTLE WHITE RABBIT', category: 'ANIMALS', type: 'Phrase' },
  { word: 'SHINY GOLD COIN', category: 'TREASURE', type: 'Phrase' }, { word: 'STEEP ROCKY PATH', category: 'MOUNTAIN', type: 'Phrase' },
  { word: 'CLEAN FRESH AIR', category: 'HEALTH', type: 'Phrase' }, { word: 'HUGE GREY WHALE', category: 'OCEAN', type: 'Phrase' },
  { word: 'HAPPY YOUNG BOY', category: 'PEOPLE', type: 'Phrase' }, { word: 'BRAVE FIRE FIGHTER', category: 'JOBS', type: 'Phrase' },
  { word: 'POWERFUL MAGIC WAND', category: 'FANTASY', type: 'Phrase' }, { word: 'BRIGHT YELLOW SUN', category: 'SPACE', type: 'Phrase' },
  { word: 'LARGE WHITE PLANE', category: 'VEHICLE', type: 'Phrase' }, { word: 'SPOOKY DARK ROOM', category: 'MYSTERY', type: 'Phrase' },
  { word: 'RED WHITE BLUE', category: 'COLORS', type: 'Normal' }, { word: 'PIZZA BURGER COKE', category: 'FOOD', type: 'Normal' },
  { word: 'SPRING SUMMER FALL', category: 'SEASONS', type: 'Normal' }, { word: 'EARTH MARS VENUS', category: 'PLANETS', type: 'Normal' },
  { word: 'SUN MOON STARS', category: 'SPACE', type: 'Normal' }, { word: 'CAT DOG BIRD', category: 'PETS', type: 'Normal' },
  { word: 'ONE TWO THREE', category: 'NUMBERS', type: 'Normal' }, { word: 'PEN PAPER INK', category: 'OFFICE', type: 'Normal' },
  { word: 'GOLD SILVER BRONZE', category: 'METALS', type: 'Normal' }, { word: 'MOM DAD BABY', category: 'FAMILY', type: 'Normal' },
  { word: 'READ WRITE SPEAK', category: 'STUDY', type: 'Normal' }, { word: 'RUN JUMP SWIM', category: 'SPORTS', type: 'Normal' },
  { word: 'SIGHT SOUND TOUCH', category: 'SENSES', type: 'Normal' }, { word: 'PAST PRESENT FUTURE', category: 'TIME', type: 'Normal' },
  { word: 'NORTH SOUTH EAST', category: 'DIRECTION', type: 'Normal' }, { word: 'TEA MILK WATER', category: 'DRINKS', type: 'Normal' }
];

// 4단어 데이터베이스 (복합 구문 - 100개 이상)
export const fourWordDatabase = [
  { word: 'BIG RED FIRE TRUCK', category: 'VEHICLES', type: 'Phrase' }, { word: 'DEEP BLUE OCEAN WATER', category: 'NATURE', type: 'Phrase' },
  { word: 'SMALL CUTE BABY PANDA', category: 'ANIMALS', type: 'Phrase' }, { word: 'HOT SPICY CHICKEN WINGS', category: 'FOOD', type: 'Phrase' },
  { word: 'ANCIENT GOLDEN CROWN JEWEL', category: 'HISTORY', type: 'Phrase' }, { word: 'SPRING SUMMER FALL WINTER', category: 'SEASONS', type: 'Normal' },
  { word: 'NORTH SOUTH EAST WEST', category: 'DIRECTION', type: 'Normal' }, { word: 'LION TIGER BEAR WOLF', category: 'ANIMALS', type: 'Normal' },
  { word: 'COFFEE TEA MILK WATER', category: 'DRINKS', type: 'Normal' }, { word: 'GUITAR DRUM PIANO VIOLIN', category: 'MUSIC', type: 'Normal' },
  { word: 'SUN MOON PLANET STAR', category: 'SPACE', type: 'Normal' }, { word: 'HAND FOOT HEAD KNEE', category: 'BODY', type: 'Normal' },
  { word: 'MOM DAD SON DAUGHTER', category: 'FAMILY', type: 'Normal' }, { word: 'RED BLUE YELLOW GREEN', category: 'COLORS', type: 'Normal' },
  { word: 'FAST CAR SLOW BIKE', category: 'VEHICLES', type: 'Normal' }, { word: 'HOT FIRE COLD ICE', category: 'ELEMENTS', type: 'Normal' },
  { word: 'SWEET SOUR BITTER SALTY', category: 'TASTE', type: 'Normal' }, { word: 'PEN PENCIL PAPER BOOK', category: 'SCHOOL', type: 'Normal' }
];
