<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <v-toolbar-title>Nostr Graph Explorer</v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Investigation Name & Controls -->
      <div v-if="graphViewRef" class="d-flex align-center gap-2 mr-2">
        <v-chip
          v-if="!graphViewRef.isEditingName"
          color="white"
          variant="flat"
          prepend-icon="mdi-file-document"
          @click="graphViewRef.startRenaming()"
          style="cursor: pointer"
          :title="'Click to rename'"
        >
          {{ graphViewRef.currentInvestigationName }}
        </v-chip>
        <v-text-field
          v-else
          v-model="graphViewRef.currentInvestigationName"
          density="compact"
          hide-details
          variant="solo"
          autofocus
          @blur="graphViewRef.finishRenaming()"
          @keyup.enter="graphViewRef.finishRenaming()"
          style="max-width: 300px"
          bg-color="white"
        ></v-text-field>

        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-content-save"
              variant="text"
              color="white"
              @click="graphViewRef.saveCurrentInvestigation()"
              :title="'Save current investigation'"
            ></v-btn>
          </template>
          <span>Save Investigation</span>
        </v-tooltip>

        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-bookmark-multiple"
              variant="text"
              color="white"
              @click="openSavedDialog"
              :title="'Manage saved investigations'"
            ></v-btn>
          </template>
          <span>Manage Saved</span>
        </v-tooltip>
      </div>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item
          prepend-icon="mdi-graph"
          title="Graph View"
          value="graph"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-filter"
          title="Filters"
          value="filters"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-note-text"
          title="My Notes"
          value="notes"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-cog"
          title="Settings"
          value="settings"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <GraphView ref="graphViewRef" />
    </v-main>

    <!-- Saved Investigations Dialog -->
    <v-dialog
      v-if="graphViewRef"
      v-model="graphViewRef.savedStatesDialog"
      max-width="800"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-bookmark-multiple</v-icon>
          Saved Investigations
          <v-spacer></v-spacer>
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="
              graphViewRef.createNewInvestigation();
              graphViewRef.savedStatesDialog = false;
            "
            class="mr-2"
          >
            New
          </v-btn>
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-import"
            @click="graphViewRef.importInvestigation()"
          >
            Import
          </v-btn>
        </v-card-title>

        <v-card-text style="max-height: 60vh; overflow-y: auto">
          <v-progress-linear
            v-if="graphViewRef.loadingStates"
            indeterminate
          ></v-progress-linear>

          <div
            v-if="graphViewRef.savedStates.length === 0 && !graphViewRef.loadingStates"
            class="text-center py-8"
          >
            <v-icon size="64" color="grey-lighten-1">mdi-bookmark-off</v-icon>
            <div class="text-h6 mt-4 text-grey">No saved investigations yet</div>
            <div class="text-body-2 text-grey">
              Click the save button to save your current investigation
            </div>
          </div>

          <v-list v-else lines="two">
            <v-list-item
              v-for="state in graphViewRef.savedStates"
              :key="state.id"
              :active="state.id === graphViewRef.currentInvestigationId"
              @click="graphViewRef.restoreInvestigation(state.id)"
              class="mb-2"
            >
              <template #prepend>
                <v-icon
                  :color="
                    state.id === graphViewRef.currentInvestigationId ? 'primary' : 'grey'
                  "
                >
                  {{
                    state.id === graphViewRef.currentInvestigationId
                      ? "mdi-bookmark-check"
                      : "mdi-bookmark"
                  }}
                </v-icon>
              </template>

              <v-list-item-title>{{ state.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ state.graphData.nodes.length }} nodes,
                {{ state.graphData.edges.length }} edges • {{ state.layoutType }} layout •
                {{ new Date(state.updatedAt).toLocaleString() }}
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex gap-1">
                  <v-btn
                    size="x-small"
                    icon="mdi-content-copy"
                    variant="text"
                    @click.stop="graphViewRef.duplicateInvestigation(state.id)"
                    :title="'Duplicate'"
                  ></v-btn>
                  <v-btn
                    size="x-small"
                    icon="mdi-export"
                    variant="text"
                    @click.stop="graphViewRef.exportInvestigation(state.id)"
                    :title="'Export to file'"
                  ></v-btn>
                  <v-btn
                    size="x-small"
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    @click.stop="graphViewRef.deleteInvestigation(state.id)"
                    :title="'Delete'"
                  ></v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="graphViewRef.savedStatesDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import GraphView from "./components/GraphView.vue";

const drawer = ref(false);
const graphViewRef = ref<InstanceType<typeof GraphView> | null>(null);

function openSavedDialog() {
  if (graphViewRef.value) {
    graphViewRef.value.savedStatesDialog = true;
    graphViewRef.value.loadSavedStates();
  }
}
</script>

<style scoped>
/* App-level styles */
</style>
