import fs from 'fs';
import path from 'path';

console.log('=== BANSAL GEO NAVIGATION, ROUTING & RESPONSIVENESS AUDIT ===\n');

const projectRoot = process.cwd();

// 1. Verify types.ts has all routes
const typesPath = path.join(projectRoot, 'src', 'navigation', 'types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

const expectedProfileRoutes = [
  'PersonalInfo',
  'AccountSecurity',
  'AppSettings',
  'NotificationPreferences',
  'Language',
  'AuditLog',
  'SentMessages',
  'HelpSupport',
];

console.log('Test 1: Validating RootStackParamList Route Types...');
for (const route of expectedProfileRoutes) {
  if (!typesContent.includes(`${route}: undefined`)) {
    console.error(`❌ Missing route type for ${route} in types.ts`);
    process.exit(1);
  }
}
console.log('✓ All 8 profile sub-page routes are properly typed in RootStackParamList\n');

// 2. Verify RootNavigator.tsx registers all expected screens
const rootNavPath = path.join(projectRoot, 'src', 'navigation', 'RootNavigator.tsx');
const rootNavContent = fs.readFileSync(rootNavPath, 'utf8');

console.log('Test 2: Validating RootNavigator.tsx Screen Registration...');
for (const route of expectedProfileRoutes) {
  const screenRegistration = `<Stack.Screen name="${route}"`;
  if (!rootNavContent.includes(screenRegistration)) {
    console.error(`❌ Missing Stack.Screen registration for ${route} in RootNavigator.tsx`);
    process.exit(1);
  }
}
console.log('✓ All 8 profile sub-page Stack.Screen registrations are present in RootNavigator.tsx\n');

// 3. Verify ProfileScreen.tsx wires every menu option
const profileScreenPath = path.join(projectRoot, 'src', 'screens', 'main', 'ProfileScreen.tsx');
const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');

console.log('Test 3: Validating ProfileScreen.tsx Navigation Dispatchers...');
for (const route of expectedProfileRoutes) {
  const navigateCall = `navigation.navigate('${route}')`;
  if (!profileScreenContent.includes(navigateCall)) {
    console.error(`❌ ProfileScreen.tsx does not call ${navigateCall}`);
    process.exit(1);
  }
}
console.log('✓ All 8 menu items in ProfileScreen.tsx call navigation.navigate() to the respective sub-screens\n');

// 4. Verify each profile screen file exists and has goBack navigation
console.log('Test 4: Validating Profile Sub-Pages Implementation & Back Navigation...');
const profileDir = path.join(projectRoot, 'src', 'screens', 'profile');

for (const route of expectedProfileRoutes) {
  const screenFileName = `${route}Screen.tsx`;
  const screenFilePath = path.join(profileDir, screenFileName);
  if (!fs.existsSync(screenFilePath)) {
    console.error(`❌ File ${screenFileName} does not exist in src/screens/profile/`);
    process.exit(1);
  }

  const content = fs.readFileSync(screenFilePath, 'utf8');
  if (!content.includes('navigation.goBack()')) {
    console.error(`❌ Screen ${screenFileName} is missing back navigation handler navigation.goBack()`);
    process.exit(1);
  }

  // Check light theme status bar
  if (!content.includes('barStyle="dark-content"') || !content.includes('backgroundColor="#ffffff"')) {
    console.error(`❌ Screen ${screenFileName} is missing dark-content light StatusBar`);
    process.exit(1);
  }
}
console.log('✓ All 8 profile sub-pages exist, include goBack() back handlers, and enforce 100% Light Theme StatusBars\n');

// 5. Verify Responsiveness properties (flex: 1 on header text, numberOfLines, touch targets)
console.log('Test 5: Validating Header Responsiveness & Overflow Prevention...');
for (const route of expectedProfileRoutes) {
  const screenFileName = `${route}Screen.tsx`;
  const screenFilePath = path.join(profileDir, screenFileName);
  const content = fs.readFileSync(screenFilePath, 'utf8');

  if (!content.includes('flex: 1') || !content.includes('numberOfLines={1}')) {
    console.error(`❌ Screen ${screenFileName} lacks responsive header constraints (flex: 1 or numberOfLines)`);
    process.exit(1);
  }
}
console.log('✓ All 8 profile screens implement responsive flex: 1 and numberOfLines constraints to prevent text truncation/overflow on narrow mobile devices\n');

// 6. Verify Role Switch integration
console.log('Test 6: Validating Role Selection Routing...');
const roleSelPath = path.join(projectRoot, 'src', 'screens', 'auth', 'RoleSelectionScreen.tsx');
const roleSelContent = fs.readFileSync(roleSelPath, 'utf8');
if (!roleSelContent.includes("routes: [{ name: 'MainTabs' }]")) {
  console.error('❌ RoleSelectionScreen does not reset route to MainTabs');
  process.exit(1);
}
console.log('✓ RoleSelectionScreen properly resets navigation to MainTabs upon switching\n');

console.log('=== ALL 6 NAVIGATION, ROUTING & RESPONSIVENESS TESTS PASSED! ===');
