import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import StatusScreen from "./src/screens/StatusScreen";
import QuestsScreen from "./src/screens/QuestsScreen";
import InventarioScreen from "./src/screens/InventarioScreen";
import UpgradeScreen from "./src/screens/UpgradeScreen";
import DungeonScreen from "./src/screens/DungeonScreen";
import ClansScreen from "./src/screens/ClansScreen";
import ShadowScreen from "./src/screens/ShadowScreen";
import AchievementsScreen from "./src/screens/AchievementsScreen";
import EvolutionScreen from "./src/screens/EvolutionScreen";
import DistribuirAtributosScreen from "./src/screens/DistribuirAtributosScreen";
import { registerForPushNotifications } from "./src/services/notifications";

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1a1a2e",
          borderTopColor: "#2a2a4e",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#00d4ff",
        tabBarInactiveTintColor: "#6b6b8d",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Status" component={StatusScreen} />
      <Tab.Screen name="Quests" component={QuestsScreen} />
      <Tab.Screen name="Inventario" component={InventarioScreen} />
      <Tab.Screen name="Upgrade" component={UpgradeScreen} />
      <Tab.Screen name="Masmorra" component={DungeonScreen} />
      <Tab.Screen name="Clãs" component={ClansScreen} />
      <Tab.Screen name="Sombras" component={ShadowScreen} />
      <Tab.Screen name="Conquistas" component={AchievementsScreen} />
      <Tab.Screen name="Evolução" component={EvolutionScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    if (isLogged) {
      registerForPushNotifications();
    }
  }, [isLogged]);

  if (!isLogged) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen onLogin={() => setIsLogged(true)} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen
          name="DistribuirAtributos"
          component={DistribuirAtributosScreen}
          options={{ presentation: "modal" }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
