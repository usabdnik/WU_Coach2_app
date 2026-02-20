#!/usr/bin/env node

/**
 * Debug: Check what's in localStorage pendingChanges
 */

console.log('📋 Инструкция:');
console.log('1. Откройте DevTools (F12)');
console.log('2. Перейдите на вкладку Application → Local Storage');
console.log('3. Найдите ключ "pendingChanges"');
console.log('4. Скопируйте значение и проверьте структуру\n');
console.log('Ожидаемая структура:');
console.log(JSON.stringify([
  {
    type: 'athlete',
    athleteId: 'uuid-here',
    athleteName: 'Имя Фамилия',
    data: { group: 'М-19' }
  }
], null, 2));
console.log('\nЕсли видите поле "id" вместо "athleteId" - очистите:');
console.log('localStorage.setItem("pendingChanges", "[]")');
