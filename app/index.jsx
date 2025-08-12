import { configureStore, createSlice, nanoid } from "@reduxjs/toolkit";
import * as Device from "expo-device"; // Native module via Expo
import * as Haptics from "expo-haptics"; // Native module via Expo
import { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Card,
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  Switch,
  Text,
  TextInput
} from "react-native-paper";
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux";

/********************
 * Managing State with Redux
 ********************/

const uiSlice = createSlice({
  name: "ui",
  initialState: { darkMode: false, showBanner: true },
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    dismissBanner(state) {
      state.showBanner = false;
    },
  },
});

const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(title) {
        return {
          payload: { id: nanoid(), title, done: false, createdAt: Date.now() },
        };
      },
    },
    toggleTodo(state, action) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
    removeTodo(state, action) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearTodos(state) {
      state.items = [];
    },
  },
});

const { toggleDarkMode, dismissBanner } = uiSlice.actions;
const { addTodo, toggleTodo, removeTodo, clearTodos } = todosSlice.actions;

const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    todos: todosSlice.reducer,
  },
});

/********************
 * App Root
 ********************/

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}

function ThemedApp() {
  const darkMode = useSelector((s) => s.ui.darkMode);
  const theme = useMemo(() => (darkMode ? MD3DarkTheme : MD3LightTheme), [darkMode]);
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppScaffold />
      </SafeAreaView>
    </PaperProvider>
  );
}

/********************
 * User Interface Design
 ********************/

function AppScaffold() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <Appbar.Header>
        <Appbar.Content
          title="Expo + Redux Demo"
          subtitle={`Running on ${Device.osName ?? "Unknown OS"}`}
        />
        <DarkModeSwitch />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[isTablet && styles.contentTablet, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.column, isTablet && styles.columnTablet]}>
          <TodosCard />
          <PendingTasksCard />
          <CompletedTasksCard />
        </View>
      </ScrollView>

      <Appbar style={styles.footer}>
        <Appbar.Action icon="github" accessibilityLabel="GitHub" onPress={() => {}} />
        <Appbar.Content
          title="Footer"
          subtitle={Platform.select({ ios: "iOS", android: "Android", default: "Web" })}
        />
      </Appbar>
    </View>
  );
}

function DarkModeSwitch() {
  const dispatch = useDispatch();
  const darkMode = useSelector((s) => s.ui.darkMode);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 12 }}>
      <Text accessibilityRole="header" style={{ marginRight: 8 }}>
        {darkMode ? "Dark" : "Light"}
      </Text>
      <Switch
        value={darkMode}
        onValueChange={() => dispatch(toggleDarkMode())}
        accessibilityLabel="Toggle dark mode"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      />
    </View>
  );
}

/********************
 * Todos Card
 * NOTE: Showing only input and adding tasks here,
 * The list will only show pending and completed separately,
 * So we don't display the list here anymore.
 ********************/

function TodosCard() {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1; // responsive list

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Todos (Redux list)"
        subtitle="Add new tasks below"
        left={(props) => <Avatar.Icon {...props} icon="check-circle-outline" />}
      />
      <Card.Content>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{ flex: 1 }}
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={() => {
              if (!title.trim()) return;
              dispatch(addTodo(title.trim()));
              setTitle("");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            returnKeyType="done"
          />
          <Button
            mode="contained"
            onPress={() => {
              if (!title.trim()) return;
              dispatch(addTodo(title.trim()));
              setTitle("");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            Add
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

/********************
 * Pending Tasks Card
 ********************/

function PendingTasksCard() {
  const dispatch = useDispatch();
  const pendingItems = useSelector((s) => s.todos.items.filter((item) => !item.done));
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1;

  if (pendingItems.length === 0) return null; // hide if none

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Pending Tasks"
        subtitle={`You have ${pendingItems.length} pending`}
        left={(props) => <Avatar.Icon {...props} icon="clock-outline" />}
      />
      <Card.Content>
        <FlatList
          data={pendingItems}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ flex: 1, marginRight: numColumns > 1 ? 8 : 0 }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon="clock-outline" />}
              />
              <Card.Actions>
                <Button onPress={() => dispatch(toggleTodo(item.id))}>Mark Done</Button>
                <Button
                  onPress={() => dispatch(removeTodo(item.id))}
                  buttonColor="red"
                  textColor="white"
                  accessibilityLabel={`Remove task ${item.title}`}
                >
                  Remove
                </Button>
              </Card.Actions>
            </Card>
          )}
        />
      </Card.Content>
    </Card>
  );
}

/********************
 * Completed Tasks Card
 ********************/

function CompletedTasksCard() {
  const dispatch = useDispatch();
  const completedItems = useSelector((s) => s.todos.items.filter((item) => item.done));
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1;

  if (completedItems.length === 0) return null; // hide if none

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Completed Tasks"
        subtitle={`You have completed ${completedItems.length} task${completedItems.length > 1 ? "s" : ""}`}
        left={(props) => <Avatar.Icon {...props} icon="check" />}
      />
      <Card.Content>
        <FlatList
          data={completedItems}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ flex: 1, marginRight: numColumns > 1 ? 8 : 0 }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon="check" />}
              />
              <Card.Actions>
                <Button onPress={() => dispatch(toggleTodo(item.id))}>Mark Undone</Button>
                <Button
                  onPress={() => dispatch(removeTodo(item.id))}
                  buttonColor="red"
                  textColor="white"
                  accessibilityLabel={`Remove completed task ${item.title}`}
                >
                  Remove
                </Button>
              </Card.Actions>
            </Card>
          )}
        />
      </Card.Content>
    </Card>
  );
}

/********************** 
 * Styles
 ********************/

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  containerTablet: { paddingHorizontal: 12 },
  content: { flex: 1, padding: 12 },
  contentTablet: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  columnTablet: { flex: 1 },
  card: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  footer: { justifyContent: "center" },
});
