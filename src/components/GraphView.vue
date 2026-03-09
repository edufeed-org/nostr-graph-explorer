<template>
  <v-container fluid class="graph-container pa-0">
    <div ref="graphRef" class="graph-canvas"></div>

    <!-- Graph controls -->
    <div class="graph-controls">
      <v-card class="pa-2" style="min-width: 280px; max-height: 90vh; overflow-y: auto">
        <!-- Search Bar -->
        <v-text-field
          v-model="searchQuery"
          label="Search events..."
          placeholder="Content, tags, authors..."
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
          @keyup.enter="performSearch"
          @click:clear="clearSearch"
          class="mb-2"
        >
          <template #append>
            <v-btn
              size="x-small"
              icon="mdi-magnify"
              variant="tonal"
              color="primary"
              @click="performSearch"
              :loading="isSearching"
            ></v-btn>
          </template>
        </v-text-field>

        <!-- Search Controls -->
        <div v-if="searchQuery" class="d-flex ga-1 mb-2">
          <v-btn
            size="x-small"
            variant="tonal"
            prepend-icon="mdi-web"
            @click="searchNostrRelays"
            :loading="isSearching"
            style="flex: 1"
          >
            Search Nostr
          </v-btn>
          <v-btn
            size="x-small"
            variant="tonal"
            :prepend-icon="searchMode === 'AND' ? 'mdi-set-center' : 'mdi-set-all'"
            @click="toggleSearchMode"
            :title="searchMode + ' mode'"
          >
            {{ searchMode }}
          </v-btn>
        </div>

        <!-- Search Results Counter -->
        <v-chip
          v-if="searchActive"
          size="small"
          variant="flat"
          color="primary"
          closable
          @click:close="clearSearch"
          class="mb-2"
        >
          <v-icon start>mdi-filter-check</v-icon>
          {{ searchResults.size }} matches
        </v-chip>

        <v-divider v-if="searchQuery || searchActive" class="mb-2"></v-divider>

        <v-select
          v-model="layoutMode"
          :items="layoutOptions"
          item-title="label"
          item-value="value"
          label="Layout"
          density="compact"
          hide-details
        ></v-select>

        <!-- Filter/Highlight Controls -->
        <div class="d-flex gap-1 mt-2">
          <v-btn
            @click="clearFilters"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-filter-off"
            block
          >
            Clear Filters
          </v-btn>
          <v-btn
            @click="resetHighlights"
            size="small"
            variant="tonal"
            color="secondary"
            prepend-icon="mdi-format-color-highlight-off"
            block
          >
            Reset Style
          </v-btn>
        </div>

        <v-divider class="my-2"></v-divider>

        <!-- Layout Settings -->
        <div class="text-caption text-medium-emphasis mb-1">Layout Settings</div>

        <div v-if="layoutMode === 'd3-force'" class="mb-2">
          <div class="text-caption text-medium-emphasis mb-1">Link Force</div>
          <v-slider
            v-model="layoutSettings.d3Force.linkDistance"
            :min="10"
            :max="500"
            label="Distance"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.linkStrength"
            :min="0"
            :max="2"
            :step="0.1"
            label="Strength"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.linkIterations"
            :min="1"
            :max="10"
            label="Iterations"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">
            Many-Body Force (Repulsion)
          </div>
          <v-slider
            v-model="layoutSettings.d3Force.manyBodyStrength"
            :min="-2000"
            :max="100"
            label="Strength"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.manyBodyTheta"
            :min="0"
            :max="1"
            :step="0.1"
            label="Theta (Accuracy)"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.manyBodyDistanceMin"
            :min="1"
            :max="100"
            label="Min Distance"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.manyBodyDistanceMax"
            :min="100"
            :max="2000"
            label="Max Distance"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Center Force</div>
          <v-slider
            v-model="layoutSettings.d3Force.centerX"
            :min="-500"
            :max="500"
            label="Center X"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.centerY"
            :min="-500"
            :max="500"
            label="Center Y"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.centerStrength"
            :min="0"
            :max="1"
            :step="0.05"
            label="Strength"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Collision Force</div>
          <v-slider
            v-model="layoutSettings.d3Force.collideRadius"
            :min="5"
            :max="100"
            label="Radius"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.collideStrength"
            :min="0"
            :max="1"
            :step="0.1"
            label="Strength"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.collideIterations"
            :min="1"
            :max="10"
            label="Iterations"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">
            ForceX (Horizontal Positioning)
          </div>
          <v-switch
            v-model="layoutSettings.d3Force.forceXEnabled"
            label="Enable ForceX"
            color="primary"
            density="compact"
            hide-details
            class="mb-1"
          ></v-switch>
          <v-slider
            v-model="layoutSettings.d3Force.forceXX"
            :min="-500"
            :max="500"
            label="X Position"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.d3Force.forceXEnabled"
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.forceXStrength"
            :min="0"
            :max="1"
            :step="0.05"
            label="Strength"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.d3Force.forceXEnabled"
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">
            ForceY (Vertical Positioning)
          </div>
          <v-switch
            v-model="layoutSettings.d3Force.forceYEnabled"
            label="Enable ForceY"
            color="primary"
            density="compact"
            hide-details
            class="mb-1"
          ></v-switch>
          <v-slider
            v-model="layoutSettings.d3Force.forceYY"
            :min="-500"
            :max="500"
            label="Y Position"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.d3Force.forceYEnabled"
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.forceYStrength"
            :min="0"
            :max="1"
            :step="0.05"
            label="Strength"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.d3Force.forceYEnabled"
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Radial Force</div>
          <v-switch
            v-model="layoutSettings.d3Force.radialEnabled"
            label="Enable Radial"
            color="primary"
            density="compact"
            hide-details
            class="mb-1"
          ></v-switch>
          <v-slider
            v-model="layoutSettings.d3Force.radialX"
            :min="-500"
            :max="500"
            label="Center X"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.d3Force.radialEnabled"
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.radialY"
            :min="-500"
            :max="500"
            label="Center Y"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.d3Force.radialEnabled"
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.radialRadius"
            :min="50"
            :max="500"
            label="Radius"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.d3Force.radialEnabled"
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.radialStrength"
            :min="0"
            :max="1"
            :step="0.05"
            label="Strength"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.d3Force.radialEnabled"
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Iteration Control</div>
          <v-slider
            v-model="layoutSettings.d3Force.alpha"
            :min="0"
            :max="1"
            :step="0.1"
            label="Alpha (Energy)"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.alphaMin"
            :min="0"
            :max="0.1"
            :step="0.001"
            label="Min Alpha"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.alphaDecay"
            :min="0"
            :max="0.1"
            :step="0.001"
            label="Alpha Decay"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.alphaTarget"
            :min="0"
            :max="1"
            :step="0.01"
            label="Alpha Target"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.d3Force.velocityDecay"
            :min="0"
            :max="1"
            :step="0.05"
            label="Velocity Decay"
            thumb-label
            density="compact"
            hide-details
          ></v-slider>
        </div>

        <div v-else-if="layoutMode === 'force'" class="mb-2">
          <div class="text-caption text-medium-emphasis mb-1">Center Position</div>
          <v-slider
            v-model="layoutSettings.force.centerX"
            :min="-500"
            :max="500"
            label="Center X"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.force.centerY"
            :min="-500"
            :max="500"
            label="Center Y"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Link/Edge Properties</div>
          <v-slider
            v-model="layoutSettings.force.linkDistance"
            :min="10"
            :max="500"
            label="Link Distance"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.force.edgeStrength"
            :min="0"
            :max="2"
            :step="0.1"
            label="Edge Strength"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Node Properties</div>
          <v-slider
            v-model="layoutSettings.force.nodeStrength"
            :min="-100"
            :max="100"
            label="Node Strength"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.force.nodeSize"
            :min="20"
            :max="100"
            label="Node Size"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.force.nodeSpacing"
            :min="10"
            :max="100"
            label="Node Spacing"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-switch
            v-model="layoutSettings.force.preventOverlap"
            label="Prevent Overlap"
            color="primary"
            density="compact"
            hide-details
            class="mb-2"
          ></v-switch>

          <div class="text-caption text-medium-emphasis mb-1">Clustering</div>
          <v-switch
            v-model="layoutSettings.force.clustering"
            label="Enable Clustering"
            color="primary"
            density="compact"
            hide-details
            class="mb-1"
          ></v-switch>
          <v-slider
            v-model="layoutSettings.force.clusterNodeStrength"
            :min="-50"
            :max="100"
            label="Cluster Node Strength"
            thumb-label
            density="compact"
            hide-details
            :disabled="!layoutSettings.force.clustering"
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Iteration Control</div>
          <v-slider
            v-model="layoutSettings.force.alpha"
            :min="0"
            :max="1"
            :step="0.05"
            label="Alpha (Energy)"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.force.alphaDecay"
            :min="0"
            :max="0.1"
            :step="0.001"
            label="Alpha Decay"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.force.alphaMin"
            :min="0"
            :max="0.1"
            :step="0.001"
            label="Min Alpha"
            thumb-label
            density="compact"
            hide-details
          ></v-slider>
        </div>

        <div v-else-if="layoutMode === 'circular'" class="mb-2">
          <v-slider
            v-model="layoutSettings.circular.radius"
            :min="200"
            :max="1000"
            label="Radius"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.circular.startRadius"
            :min="100"
            :max="500"
            label="Start Radius (Spiral)"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.circular.endRadius"
            :min="400"
            :max="1200"
            label="End Radius (Spiral)"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.circular.divisions"
            :min="1"
            :max="10"
            label="Divisions"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.circular.angleRatio"
            :min="0.1"
            :max="2"
            :step="0.1"
            label="Angle Ratio"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.circular.startAngle"
            :min="0"
            :max="6.28"
            :step="0.1"
            label="Start Angle"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.circular.endAngle"
            :min="0"
            :max="6.28"
            :step="0.1"
            label="End Angle"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.circular.nodeSize"
            :min="20"
            :max="120"
            label="Node Size"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.circular.nodeSpacing"
            :min="5"
            :max="50"
            label="Node Spacing"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-select
            v-model="layoutSettings.circular.ordering"
            :items="['topology', 'topology-directed', 'degree', null]"
            label="Ordering"
            density="compact"
            hide-details
            class="mb-1"
          ></v-select>
          <v-switch
            v-model="layoutSettings.circular.clockwise"
            label="Clockwise"
            color="primary"
            density="compact"
            hide-details
          ></v-switch>
        </div>

        <div v-else-if="layoutMode === 'compact-box'" class="mb-2">
          <v-select
            v-model="layoutSettings.compactBox.direction"
            :items="['LR', 'RL', 'TB', 'BT', 'H', 'V']"
            label="Direction"
            density="compact"
            hide-details
            class="mb-1"
          ></v-select>
          <v-slider
            v-model="layoutSettings.compactBox.nodeWidth"
            :min="20"
            :max="100"
            label="Node Width"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.compactBox.nodeHeight"
            :min="20"
            :max="100"
            label="Node Height"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.compactBox.hGap"
            :min="50"
            :max="200"
            label="Horizontal Gap"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.compactBox.vGap"
            :min="50"
            :max="200"
            label="Vertical Gap"
            thumb-label
            density="compact"
            hide-details
          ></v-slider>
        </div>

        <div v-else-if="layoutMode === 'dagre'" class="mb-2">
          <v-select
            v-model="layoutSettings.dagre.rankdir"
            :items="['TB', 'BT', 'LR', 'RL']"
            label="Direction"
            density="compact"
            hide-details
            class="mb-1"
          ></v-select>
          <v-slider
            v-model="layoutSettings.dagre.nodesep"
            :min="20"
            :max="200"
            label="Node Separation"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.dagre.ranksep"
            :min="50"
            :max="300"
            label="Rank Separation"
            thumb-label
            density="compact"
            hide-details
          ></v-slider>
        </div>

        <div v-else-if="layoutMode === 'concentric'" class="mb-2">
          <v-slider
            v-model="layoutSettings.concentric.minNodeSpacing"
            :min="10"
            :max="100"
            label="Min Node Spacing"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-switch
            v-model="layoutSettings.concentric.preventOverlap"
            label="Prevent Overlap"
            color="primary"
            density="compact"
            hide-details
          ></v-switch>
        </div>

        <div v-else-if="layoutMode === 'grid'" class="mb-2">
          <v-slider
            v-model="layoutSettings.grid.rows"
            :min="1"
            :max="20"
            label="Rows"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.grid.cols"
            :min="1"
            :max="20"
            label="Columns"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-switch
            v-model="layoutSettings.grid.preventOverlap"
            label="Prevent Overlap"
            color="primary"
            density="compact"
            hide-details
          ></v-switch>
        </div>

        <div v-else-if="layoutMode === 'radial'" class="mb-2">
          <v-slider
            v-model="layoutSettings.radial.unitRadius"
            :min="50"
            :max="200"
            label="Unit Radius"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-switch
            v-model="layoutSettings.radial.preventOverlap"
            label="Prevent Overlap"
            color="primary"
            density="compact"
            hide-details
          ></v-switch>
        </div>

        <div v-else-if="layoutMode === 'dendrogram'" class="mb-2">
          <div class="text-caption text-medium-emphasis mb-1">Layout Type</div>
          <v-switch
            v-model="layoutSettings.dendrogram.radial"
            label="Radial Mode"
            color="primary"
            density="compact"
            hide-details
            class="mb-2"
          ></v-switch>

          <div class="text-caption text-medium-emphasis mb-1">Direction</div>
          <v-select
            v-model="layoutSettings.dendrogram.direction"
            :items="['LR', 'RL', 'TB', 'BT', 'H', 'V']"
            label="Direction"
            density="compact"
            hide-details
            :disabled="layoutSettings.dendrogram.radial"
            class="mb-2"
          ></v-select>

          <div class="text-caption text-medium-emphasis mb-1">Spacing</div>
          <v-slider
            v-model="layoutSettings.dendrogram.nodeSep"
            :min="10"
            :max="200"
            label="Node Separation"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.dendrogram.rankSep"
            :min="50"
            :max="400"
            label="Rank Separation"
            thumb-label
            density="compact"
            hide-details
          ></v-slider>
        </div>

        <div v-else-if="layoutMode === 'mindmap'" class="mb-2">
          <div class="text-caption text-medium-emphasis mb-1">Direction</div>
          <v-select
            v-model="layoutSettings.mindmap.direction"
            :items="[
              { title: 'Horizontal (H)', value: 'H' },
              { title: 'Vertical (V)', value: 'V' },
              { title: 'Left to Right (LR)', value: 'LR' },
              { title: 'Right to Left (RL)', value: 'RL' },
              { title: 'Top to Bottom (TB)', value: 'TB' },
              { title: 'Bottom to Top (BT)', value: 'BT' },
            ]"
            label="Direction"
            density="compact"
            hide-details
            class="mb-2"
          ></v-select>

          <div class="text-caption text-medium-emphasis mb-1">Spacing</div>
          <v-slider
            v-model="layoutSettings.mindmap.hGap"
            :min="10"
            :max="200"
            label="Horizontal Gap"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.mindmap.vGap"
            :min="10"
            :max="200"
            label="Vertical Gap"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Node Size</div>
          <v-slider
            v-model="layoutSettings.mindmap.getHeight"
            :min="20"
            :max="100"
            label="Node Height"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.mindmap.getWidth"
            :min="50"
            :max="300"
            label="Node Width"
            thumb-label
            density="compact"
            hide-details
          ></v-slider>
        </div>

        <div v-else-if="layoutMode === 'fruchterman'" class="mb-2">
          <div class="text-caption text-medium-emphasis mb-1">Center Position</div>
          <v-slider
            v-model="layoutSettings.fruchterman.centerX"
            :min="-500"
            :max="500"
            label="Center X"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.fruchterman.centerY"
            :min="-500"
            :max="500"
            label="Center Y"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Physics Parameters</div>
          <v-slider
            v-model="layoutSettings.fruchterman.maxIteration"
            :min="100"
            :max="5000"
            :step="100"
            label="Max Iterations"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.fruchterman.gravity"
            :min="1"
            :max="50"
            label="Gravity"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.fruchterman.speed"
            :min="1"
            :max="20"
            label="Speed"
            thumb-label
            density="compact"
            hide-details
            class="mb-2"
          ></v-slider>

          <div class="text-caption text-medium-emphasis mb-1">Clustering</div>
          <v-switch
            v-model="layoutSettings.fruchterman.clustering"
            label="Enable Clustering"
            density="compact"
            hide-details
            class="mb-1"
          ></v-switch>
          <v-slider
            v-model="layoutSettings.fruchterman.clusterGravity"
            :min="1"
            :max="50"
            label="Cluster Gravity"
            :disabled="!layoutSettings.fruchterman.clustering"
            thumb-label
            density="compact"
            hide-details
          ></v-slider>
        </div>

        <div v-else-if="layoutMode === 'mds'" class="mb-2">
          <div class="text-caption text-medium-emphasis mb-1">MDS Layout Settings</div>
          <v-slider
            v-model="layoutSettings.mds.linkDistance"
            :min="50"
            :max="5000"
            :step="10"
            label="Link Distance"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.mds.center.x"
            :min="-500"
            :max="500"
            label="Center X"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.mds.center.y"
            :min="-500"
            :max="500"
            label="Center Y"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
        </div>

        <div v-else-if="layoutMode === 'fishbone'" class="mb-2">
          <div class="text-caption text-medium-emphasis mb-1">Direction</div>
          <v-select
            v-model="layoutSettings.fishbone.direction"
            :items="[
              { title: 'Horizontal (H)', value: 'H' },
              { title: 'Vertical (V)', value: 'V' },
              { title: 'Left to Right (LR)', value: 'LR' },
              { title: 'Right to Left (RL)', value: 'RL' },
              { title: 'Top to Bottom (TB)', value: 'TB' },
              { title: 'Bottom to Top (BT)', value: 'BT' },
            ]"
            label="Direction"
            density="compact"
            hide-details
            class="mb-2"
          ></v-select>

          <div class="text-caption text-medium-emphasis mb-1">Spacing</div>
          <v-slider
            v-model="layoutSettings.fishbone.hGap"
            :min="10"
            :max="200"
            label="Horizontal Gap"
            thumb-label
            density="compact"
            hide-details
            class="mb-1"
          ></v-slider>
          <v-slider
            v-model="layoutSettings.fishbone.vGap"
            :min="10"
            :max="200"
            label="Vertical Gap"
            thumb-label
            density="compact"
            hide-details
          ></v-slider>
        </div>

        <div v-else class="mb-2">
          <p class="text-caption text-medium-emphasis">No settings for this layout</p>
        </div>

        <v-divider class="my-2"></v-divider>

        <div class="d-flex ga-1">
          <v-btn
            icon="mdi-fit-to-screen"
            size="small"
            @click="fitView"
            title="Fit to screen"
          ></v-btn>
          <v-btn
            :icon="isAnimating ? 'mdi-pause' : 'mdi-play'"
            size="small"
            @click="toggleAnimation"
            :title="isAnimating ? 'Stop animation' : 'Resume animation'"
          ></v-btn>
          <v-btn
            icon="mdi-refresh"
            size="small"
            @click="refreshGraph"
            title="Refresh"
          ></v-btn>
        </div>
      </v-card>
    </div>

    <!-- Data controls -->
    <div class="data-controls">
      <v-card class="pa-2">
        <div class="d-flex flex-column ga-2">
          <v-btn
            size="small"
            color="primary"
            prepend-icon="mdi-download"
            :loading="isFetching"
            @click="fetchGlobal"
          >
            Fetch Global
          </v-btn>

          <v-btn size="small" prepend-icon="mdi-database" @click="loadFromDb">
            Load from DB
          </v-btn>

          <v-btn size="small" prepend-icon="mdi-delete" @click="clearAll"> Clear </v-btn>

          <v-divider class="my-1"></v-divider>

          <v-tooltip
            :text="`${relayManager.stats.value.enabled} enabled, ${relayManager.stats.value.connected} connected`"
            location="end"
          >
            <template #activator="{ props }">
              <v-chip
                v-bind="props"
                size="small"
                variant="tonal"
                prepend-icon="mdi-server-network"
                :color="relayManager.stats.value.connected > 0 ? 'success' : 'error'"
                @click="relayDialog.show = true"
                style="cursor: pointer"
              >
                {{ relayManager.stats.value.total }} Relays
              </v-chip>
            </template>
          </v-tooltip>
        </div>
      </v-card>
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <v-chip size="small" variant="flat">
        <v-icon start>mdi-chart-bubble</v-icon>
        {{ nodeCount }} nodes
      </v-chip>
      <v-chip size="small" variant="flat" class="ml-2">
        <v-icon start>mdi-connection</v-icon>
        {{ edgeCount }} edges
      </v-chip>
      <v-chip v-if="isFetching" size="small" variant="flat" color="primary" class="ml-2">
        <v-icon start>mdi-loading mdi-spin</v-icon>
        Fetching...
      </v-chip>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Context Menu -->
    <v-menu
      v-model="contextMenu.show"
      :location="'bottom'"
      :style="{
        position: 'fixed',
        left: contextMenu.x + 'px',
        top: contextMenu.y + 'px',
      }"
    >
      <v-list density="compact" min-width="200">
        <v-list-subheader>{{ contextMenu.title }}</v-list-subheader>

        <v-list-item
          v-for="action in contextMenu.actions"
          :key="action.label"
          @click="action.handler"
          :prepend-icon="action.icon"
        >
          <v-list-item-title>{{ action.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Relay Manager Dialog -->
    <v-dialog v-model="relayDialog.show" max-width="700">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Relay Manager</span>
          <v-chip
            size="small"
            :color="relayManager.stats.value.connected > 0 ? 'success' : 'error'"
          >
            {{ relayManager.stats.value.connected }}/{{
              relayManager.stats.value.enabled
            }}
            Connected
          </v-chip>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text style="max-height: 500px; overflow-y: auto">
          <!-- Add New Relay -->
          <div class="mb-4">
            <v-text-field
              v-model="newRelayUrl"
              label="Add New Relay"
              placeholder="wss://relay.example.com"
              density="compact"
              prepend-inner-icon="mdi-plus"
              :error-messages="relayManager.error.value || undefined"
              @keyup.enter="handleAddRelay"
            >
              <template #append>
                <v-btn
                  size="small"
                  color="primary"
                  @click="handleAddRelay"
                  :loading="relayManager.loading.value"
                >
                  Add
                </v-btn>
              </template>
            </v-text-field>
          </div>

          <!-- Relay List -->
          <div v-if="relayManager.relays.value.length > 0">
            <div
              v-for="relay in relayManager.relays.value"
              :key="relay.url"
              class="relay-item"
            >
              <v-icon
                size="small"
                :color="getRelayStatusColor(relay.status)"
                :icon="getRelayStatusIcon(relay.status)"
              ></v-icon>

              <div class="relay-info">
                <div class="relay-url">{{ relay.url }}</div>
                <div class="relay-details">
                  <span v-if="relay.lastConnected">
                    <v-icon size="x-small">mdi-clock-outline</v-icon>
                    {{ formatRelativeTime(relay.lastConnected) }}
                  </span>
                  <span v-if="relay.latency !== null">
                    <v-icon size="x-small">mdi-speedometer</v-icon>
                    {{ relay.latency }}ms
                  </span>
                  <span>
                    <v-icon size="x-small">mdi-email-multiple-outline</v-icon>
                    {{ relay.eventsReceived }} events
                  </span>
                </div>
                <div v-if="relay.lastError" class="relay-error">
                  {{ relay.lastError }}
                </div>
              </div>

              <div class="relay-actions">
                <v-btn
                  size="small"
                  :icon="relay.enabled ? 'mdi-pause' : 'mdi-play'"
                  :color="relay.enabled ? 'warning' : 'success'"
                  variant="tonal"
                  @click="handleToggleRelay(relay.url)"
                ></v-btn>
                <v-btn
                  size="small"
                  icon="mdi-delete"
                  color="error"
                  variant="tonal"
                  @click="handleRemoveRelay(relay.url)"
                ></v-btn>
              </div>
            </div>
          </div>

          <v-alert
            v-if="relayManager.relays.value.length === 0"
            type="info"
            variant="tonal"
            class="mt-4"
          >
            No relays configured. Add your first relay above.
          </v-alert>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-btn
            prepend-icon="mdi-refresh"
            @click="handleTestConnections"
            :loading="testingConnections"
          >
            Test Connections
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="relayDialog.show = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { Graph } from "@antv/g6";
import { useGraphStore } from "../stores/graph";
import { useEventFetcher } from "../composables/useEventFetcher";
import { useRelayManager } from "../composables/useRelayManager";
import { useNostr } from "../composables/useNostr";
import { parseNostrQuery } from "../tools/nostr-dsl";
import { storeToRefs } from "pinia";
import MarkdownIt from "markdown-it";
import {
  saveGraphState,
  updateGraphState,
  loadGraphState,
  getAllGraphStates,
  deleteGraphState,
  duplicateGraphState,
  exportGraphState,
  importGraphState,
  setLastActiveState,
  getLastActiveState,
  type GraphState,
} from "../db/graphStates";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const graphRef = ref<HTMLElement | null>(null);
let graph: Graph | null = null;
let layoutSettingsDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const layoutMode = ref("mds");

// All layout options with tree/non-tree classification
const allLayoutOptions = [
  { label: "Circular Layout", value: "circular", requiresTree: false },
  { label: "Concentric Layout", value: "concentric", requiresTree: false },
  { label: "D3 Force-Directed Layout", value: "d3-force", requiresTree: false },
  { label: "Force-directed Layout", value: "force", requiresTree: false },
  { label: "ForceAtlas2 Layout", value: "force-atlas2", requiresTree: false },
  { label: "Fruchterman Layout", value: "fruchterman", requiresTree: false },
  { label: "Grid Layout", value: "grid", requiresTree: false },
  { label: "MDS Layout", value: "mds", requiresTree: false },
  { label: "Radial Layout", value: "radial", requiresTree: false },
  { label: "Random Layout", value: "random", requiresTree: false },
  { label: "AntV Dagre Layout", value: "dagre", requiresTree: true },
  { label: "CompactBox Tree", value: "compact-box", requiresTree: true },
  { label: "Dendrogram Tree", value: "dendrogram", requiresTree: true },
  { label: "Mindmap Tree", value: "mindmap", requiresTree: true },
  { label: "Indented Tree", value: "indented", requiresTree: true },
  { label: "Fishbone Diagram", value: "fishbone", requiresTree: true },
];

// Layout settings with defaults
const layoutSettings = ref({
  d3Force: {
    // Link force
    linkDistance: 150,
    linkStrength: 0.6,
    linkIterations: 1,
    // Many-body force (node repulsion/attraction)
    manyBodyStrength: -300,
    manyBodyTheta: 0.9,
    manyBodyDistanceMin: 1,
    manyBodyDistanceMax: 1000,
    // Center force
    centerX: 0,
    centerY: 0,
    centerStrength: 0.1,
    // Collision force
    collideRadius: 30,
    collideStrength: 0.8,
    collideIterations: 1,
    // ForceX (horizontal positioning)
    forceXEnabled: false,
    forceXX: 0,
    forceXStrength: 0.1,
    // ForceY (vertical positioning)
    forceYEnabled: false,
    forceYY: 0,
    forceYStrength: 0.1,
    // Radial force
    radialEnabled: false,
    radialX: 0,
    radialY: 0,
    radialRadius: 200,
    radialStrength: 0.1,
    // Iteration control
    alpha: 1,
    alphaMin: 0.001,
    alphaDecay: 0.06, // Increased from 0.028 for faster animation
    alphaTarget: 0,
    velocityDecay: 0.3, // Decreased from 0.4 for faster movement
  },
  force: {
    // Center position
    centerX: 0,
    centerY: 0,
    // Link/Edge properties
    linkDistance: 150,
    edgeStrength: 0.6,
    // Node properties
    nodeStrength: 30,
    nodeSize: 60,
    nodeSpacing: 20,
    preventOverlap: true,
    // Clustering
    clustering: false,
    clusterNodeStrength: 20,
    // Iteration control
    alpha: 0.3,
    alphaDecay: 0.028,
    alphaMin: 0.001,
  },
  circular: {
    radius: 600,
    startRadius: 300,
    endRadius: 900,
    divisions: 5,
    angleRatio: 1,
    clockwise: true,
    ordering: "degree",
    startAngle: 0,
    endAngle: 6.28,
    nodeSize: 60,
    nodeSpacing: 10,
  },
  compactBox: {
    direction: "LR",
    nodeWidth: 60,
    nodeHeight: 60,
    hGap: 120,
    vGap: 80,
  },
  dagre: {
    rankdir: "LR",
    nodesep: 100,
    ranksep: 200,
  },
  concentric: {
    minNodeSpacing: 50,
    preventOverlap: true,
  },
  grid: {
    rows: 5,
    cols: 5,
    preventOverlap: true,
  },
  radial: {
    unitRadius: 100,
    preventOverlap: true,
  },
  dendrogram: {
    direction: "LR",
    nodeSep: 50,
    rankSep: 100,
    radial: false,
  },
  mindmap: {
    direction: "H",
    hGap: 50,
    vGap: 50,
    getHeight: 30,
    getWidth: 100,
  },
  fruchterman: {
    centerX: 0,
    centerY: 0,
    maxIteration: 1000,
    gravity: 10,
    speed: 5,
    clustering: false,
    clusterGravity: 10,
  },
  mds: {
    linkDistance: 200,
    center: { x: 0, y: 0 },
  },
  fishbone: {
    direction: "LR",
    hGap: 50,
    vGap: 50,
  },
});

const graphStore = useGraphStore();
const { nodeCount, edgeCount, graphData } = storeToRefs(graphStore);

// Check if the current graph structure is tree-compatible (acyclic)
const isTreeCompatible = computed(() => {
  if (!graphData.value || !graphData.value.edges || !graphData.value.nodes) {
    return false; // Empty graph is not a tree
  }

  const edges = graphData.value.edges;
  const nodes = graphData.value.nodes;

  if (edges.length === 0 || nodes.length === 0) {
    return false;
  }

  // Build adjacency list
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((node) => {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    const neighbors = adj.get(edge.source) || [];
    neighbors.push(edge.target);
    adj.set(edge.source, neighbors);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // For a tree: each node (except root) should have exactly one parent
  // and there should be no cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true; // Cycle detected
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  // Check for cycles starting from nodes with 0 in-degree (potential roots)
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        return false; // Cycle found
      }
    }
  }

  return true; // No cycles, tree-compatible
});

// All layout options are always available
// Tree layouts will create a spanning tree from any graph structure
const layoutOptions = computed(() => {
  return allLayoutOptions;
});

const {
  fetchGlobalFeed,
  fetchInitialEvents,
  fetchByAuthor,
  expandAroundEvent,
  fetchUserGraph,
  isFetching,
  expandReactions,
  expandReplies,
  expandReposts,
  expandMentions,
  expandThread,
} = useEventFetcher();
const { testAllRelayConnections, loadRelaysFromDB, getPool, relays: nostrRelays } = useNostr();

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
  timeout: 3000,
});

// Context menu state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  title: "",
  actions: [] as Array<{ label: string; icon: string; handler: () => void }>,
});

// Search state
const searchQuery = ref("");
const searchResults = ref<Set<string>>(new Set());
const searchActive = ref(false);
const searchMode = ref<"AND" | "OR">("AND");
const isSearching = ref(false);

// Investigation state management
const currentInvestigationId = ref<string | null>(null);
const currentInvestigationName = ref("Untitled Investigation");
const isEditingName = ref(false);
const savedStatesDialog = ref(false);
const savedStates = ref<GraphState[]>([]);
const loadingStates = ref(false);

// Expanding nodes state (for loading indicators)
const expandingNodes = ref<Set<string>>(new Set());

// Track which stats have been expanded for each event
type StatType = "reactions" | "replies" | "reposts" | "mentions" | "thread";
const expandedStats = ref<Map<string, Set<StatType>>>(new Map());

// Tree layout state - keep graph data, show tree as projection
const treeRootId = ref<string | null>(null); // Root node for tree layouts
const originalGraphData = ref<{ nodes: any[]; edges: any[] } | null>(null); // Keep original graph data
const selectedCardId = ref<string | null>(null); // Currently selected card for scrolling
const selectedCollapsedNodeId = ref<string | null>(null); // Currently selected collapsed node for visual feedback

// Multi-selection state (synced with G6's selection state)
const selectedNodeIds = ref<Set<string>>(new Set()); // Multiple selected nodes

// Animation state
const isAnimating = ref(true);

// Timebar state
const timebarTimeRange = ref<[number, number] | null>(null);

// Computed: Generate time distribution data for timebar
const timebarData = computed(() => {
  const nodes = graphStore.nodes;
  if (!nodes || nodes.length === 0) {
    // Return dummy data when no nodes exist (timebar needs at least one data point)
    const now = Date.now();
    return [{ time: now - 86400000, value: 1 }, { time: now, value: 1 }];
  }

  // Get all timestamps and group by day
  const dayMap = new Map<string, number>();
  nodes.forEach((node: any) => {
    const event = node.data?.event;
    if (!event?.created_at) return;

    const timestamp = event.created_at * 1000; // Convert to ms
    const dayKey = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
  });

  // Convert to timebar format
  const result = Array.from(dayMap.entries())
    .map(([day, count]) => ({
      time: new Date(day).getTime(),
      value: count,
    }))
    .sort((a, b) => a.time - b.time);

  // Ensure we have at least 2 data points
  if (result.length < 2) {
    const now = Date.now();
    return [{ time: now - 86400000, value: 1 }, { time: now, value: 1 }];
  }

  return result;
});

// Computed: Default time range (last 90 days)
const defaultTimeRange = computed((): [number, number] => {
  const now = Date.now();
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
  return [ninetyDaysAgo, now];
});

// Edge styling configuration based on relationship hierarchy
const edgeStyles = {
  "authored-by": {
    stroke: "#8b5cf6", // Purple - strongest (identity)
    lineWidth: 3,
    lineDash: [0], // Solid
    label: "authored by",
    opacity: 0.9,
  },
  reply: {
    stroke: "#10b981", // Green - strong (conversation)
    lineWidth: 2.5,
    lineDash: [0], // Solid
    label: "replies to",
    opacity: 0.85,
  },
  reference: {
    stroke: "#3b82f6", // Blue - medium-strong (content link)
    lineWidth: 2,
    lineDash: [0], // Solid
    label: "references",
    opacity: 0.8,
  },
  mention: {
    stroke: "#f97316", // Orange - medium (user reference)
    lineWidth: 2,
    lineDash: [5, 3], // Dashed
    label: "mentions",
    opacity: 0.7,
  },
  repost: {
    stroke: "#06b6d4", // Cyan - weaker (amplification)
    lineWidth: 1.5,
    lineDash: [5, 3], // Dashed
    label: "reposts",
    opacity: 0.6,
  },
  reaction: {
    stroke: "#ec4899", // Pink - weakest (engagement)
    lineWidth: 1,
    lineDash: [2, 2], // Dotted
    label: "reacts to",
    opacity: 0.5,
  },
  default: {
    stroke: "#999", // Gray - unknown
    lineWidth: 1.5,
    lineDash: [0],
    label: "connected to",
    opacity: 0.6,
  },
};

// Helper: Get edge style based on type and marker
function getEdgeStyle(edge: any) {
  const type = edge.data?.type;
  const marker = edge.data?.marker;

  // Determine edge category
  let category: keyof typeof edgeStyles = "default";

  if (type === "authored-by") {
    category = "authored-by";
  } else if (type === "reference") {
    // Differentiate reply from general reference
    category = marker === "reply" ? "reply" : "reference";
  } else if (type === "mention") {
    category = "mention";
  } else if (type === "repost") {
    category = "repost";
  } else if (type === "reaction") {
    category = "reaction";
  }

  return edgeStyles[category];
}

// Relay manager
const relayManager = useRelayManager();
const relayDialog = ref({ show: false });
const newRelayUrl = ref("");
const testingConnections = ref(false);

// Helper: Get border color for event kind
function getKindColor(kind: number): string {
  const colors: Record<number, string> = {
    0: "#3b82f6", // Profile - blue
    1: "#10b981", // Note - green
    3: "#f59e0b", // Contacts - amber
    4: "#8b5cf6", // DM - purple
    5: "#ef4444", // Delete - red
    6: "#06b6d4", // Repost - cyan
    7: "#ec4899", // Reaction - pink
    9735: "#f59e0b", // Zap - amber/gold
    30023: "#6366f1", // Article - indigo
  };
  return colors[kind] || "#6b7280"; // gray default
}

// Helper: Get CSS class for tree root node marker
function getNodeMarkerClass(nodeId: string): string {
  const isRoot = treeRootId.value === nodeId;

  if (isRoot && isTreeLayout(layoutMode.value)) {
    return " tree-root-node"; // Red border for tree root
  }
  return "";
}

// Helper: Extract tags from event
function extractTags(event: any): string[] {
  if (!event.tags) return [];
  return event.tags
    .filter((tag: any) => tag[0] === "t" && tag[1])
    .map((tag: any) => tag[1]);
}

// Helper: Extract mentions from event
function extractMentions(event: any): Array<{ pubkey: string; relay?: string }> {
  if (!event.tags) return [];
  return event.tags
    .filter((tag: any) => tag[0] === "p" && tag[1])
    .map((tag: any) => ({ pubkey: tag[1], relay: tag[2] }));
}

// Helper: Check if event is a reply
function isReply(event: any): { isReply: boolean; replyTo?: string; root?: string } {
  if (!event.tags) return { isReply: false };

  const eTags = event.tags.filter((tag: any) => tag[0] === "e" && tag[1]);
  if (eTags.length === 0) return { isReply: false };

  // Find root and reply markers
  const rootTag = eTags.find((tag: any) => tag[3] === "root");
  const replyTag = eTags.find((tag: any) => tag[3] === "reply");

  return {
    isReply: true,
    root: rootTag ? rootTag[1] : eTags[0][1],
    replyTo: replyTag
      ? replyTag[1]
      : eTags.length > 1
      ? eTags[eTags.length - 1][1]
      : undefined,
  };
}

// Helper: Format relative time
function getRelativeTime(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

// Helper: Count engagement metrics for an event
function getEngagementMetrics(
  eventId: string
): {
  replies: number;
  reactions: number;
  reposts: number;
  zaps: number;
} {
  const metrics = { replies: 0, reactions: 0, reposts: 0, zaps: 0 };

  // Count from all nodes in the graph
  graphStore.nodes.forEach((node) => {
    const event = node.data?.event;
    if (!event) return;

    // Check if this event references the target event
    const eTags = event.tags?.filter((t: string[]) => t[0] === "e") || [];
    const referencesEvent = eTags.some((t: string[]) => t[1] === eventId);

    if (referencesEvent) {
      if (event.kind === 1) metrics.replies++;
      else if (event.kind === 7) metrics.reactions++;
      else if (event.kind === 6) metrics.reposts++;
      else if (event.kind === 9735) metrics.zaps++;
    }
  });

  return metrics;
}

// Helper: Render HTML for event node
function renderEventNode(d: any): string {
  // Handle virtual tree root
  if (d.id === "__tree_super_root__" && d.data?.isVirtualRoot) {
    return `
      <div class="node-circle virtual-root-node" data-item-id="${d.id}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 4px solid #667eea;">
        <span class="node-emoji" style="font-size: 32px;">🌳</span>
      </div>
    `;
  }

  // Handle tag nodes
  if (d.data?.type === "tag") {
    const tag = d.data?.tag || "";
    const nodeId = d.id || "";
    const tagColor = d.data?.color || "#f59e0b";
    const markerClass = getNodeMarkerClass(nodeId);

    return `
      <div class="node-circle tag-node${markerClass}" data-item-id="${nodeId}" data-tag="${tag}" style="background: ${tagColor}; border: 4px solid ${tagColor};">
        <span class="node-tag-label">#${tag}</span>
      </div>
    `;
  }

  // Handle pubkey (author) nodes
  if (d.data?.type === "pubkey") {
    const profile = d.data?.profile;
    const expanded = !!d.data?.expanded;

    // If collapsed, show compact profile circle
    if (!expanded) {
      const nodeId = d.id || "";
      const pubkey = d.data?.pubkey || "";
      const markerClass = getNodeMarkerClass(nodeId);

      if (profile?.picture) {
        // Show profile picture
        return `
          <div class="node-circle pubkey-node with-picture${markerClass}" data-item-id="${nodeId}" data-pubkey="${pubkey}" style="background: #fff;">
            <img src="${profile.picture}" class="profile-picture" alt="${
          profile.name || "User"
        }" />
          </div>
        `;
      } else {
        // Show default user icon
        return `
          <div class="node-circle pubkey-node${markerClass}" data-item-id="${nodeId}" data-pubkey="${pubkey}" style="background: #6366f1;">
            <span class="node-emoji">👤</span>
          </div>
        `;
      }
    }

    // Expanded: show profile details if available
    if (profile) {
      const safe = (s: string) =>
        String(s || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const displayName = safe(profile.name || profile.display_name || "Unknown User");
      const about = safe(profile.about || "No bio available");
      const nip05 = safe(profile.nip05 || "");
      const pubkey = safe(d.data?.pubkey || "");
      const nodeId = safe(d.id || "");

      return `
        <div class="event-node expanded profile-card" data-item-id="${nodeId}" data-pubkey="${pubkey}">
          <div class="event-titlebar" data-role="titlebar">
            <div class="event-left">
              <span class="event-badge">👤 Profile</span>
              <span class="event-title">${displayName}</span>
            </div>
            <div class="event-close" data-role="close">×</div>
          </div>
          <div class="event-body">
            ${
              profile.picture
                ? `
              <div class="profile-picture-large">
                <img src="${profile.picture}" alt="${displayName}" />
              </div>
            `
                : ""
            }
            <div class="event-meta">
              <div><strong>Name:</strong> ${displayName}</div>
              ${nip05 ? `<div><strong>NIP-05:</strong> ${nip05}</div>` : ""}
              <div><strong>Pubkey:</strong> ${pubkey.slice(0, 16)}...</div>
            </div>
            <div class="event-content profile-bio">${about}</div>
          </div>
        </div>
      `;
    }

    // No profile data available
    const noProfNodeId = d.id || "";
    const noProfPubkey = d.data?.pubkey || "";
    const markerClass = getNodeMarkerClass(noProfNodeId);
    return `
      <div class="node-circle pubkey-node${markerClass}" data-item-id="${noProfNodeId}" data-pubkey="${noProfPubkey}" style="background: #6366f1;">
        <span class="node-emoji">👤</span>
      </div>
    `;
  }

  // Handle event nodes
  const event = d.data?.event;
  if (!event) return '<div class="node-circle loading"><span>?</span></div>';

  const expanded = !!d.data?.expanded;
  const kind = event.kind;
  const typeLabel = getEventTypeLabel(kind);
  const kindColor = getKindColor(kind);

  // If collapsed, render as simple circle
  if (!expanded) {
    const emoji = typeLabel.split(" ")[0]; // Get just the emoji
    const nodeId = d.id || "";
    const markerClass = getNodeMarkerClass(nodeId);

    return `
      <div class="node-circle kind-${kind}${markerClass}" data-item-id="${nodeId}" style="background: ${kindColor}; border: 3px solid ${kindColor};">
        <span class="node-emoji">${emoji}</span>
      </div>
    `;
  }

  // Expanded: render detailed card with all metadata
  const safe = (s: string) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const nodeId = safe(d.id || "");
  const timestamp = getRelativeTime(event.created_at);
  const absoluteTime = new Date(event.created_at * 1000).toLocaleString();

  // Extract metadata
  const tags = extractTags(event);
  const mentions = extractMentions(event);
  const threadInfo = isReply(event);

  // Get engagement metrics
  const metrics = getEngagementMetrics(event.id);

  // Count mentions (e tags in this event)
  const mentionsCount = event.tags?.filter((t: string[]) => t[0] === "e").length || 0;

  // Check if part of thread (has parent or replies)
  const hasThread = threadInfo.isReply || metrics.replies > 0;

  // Get author info (from graph data if available)
  const authorPubkey = safe(event.pubkey);
  const authorDisplay = authorPubkey.slice(0, 8) + "...";

  // Format content with markdown for kind 1 and 30023
  let bodyContent = "";
  if (kind === 1 || kind === 30023) {
    bodyContent = md.render(event.content);
  } else if (kind === 0) {
    try {
      const profile = JSON.parse(event.content);
      bodyContent = `<pre>${safe(JSON.stringify(profile, null, 2))}</pre>`;
    } catch {
      bodyContent = safe(event.content);
    }
  } else {
    bodyContent = md.render(event.content);
  }

  // Calculate dynamic height based on content
  const contentLength = event.content.length;
  const baseHeight = 200;
  const heightPerChar = 0.3;
  const maxHeight = 600;
  const minHeight = 200;
  const dynamicHeight = Math.min(
    maxHeight,
    Math.max(minHeight, baseHeight + contentLength * heightPerChar)
  );

  const isLoading = expandingNodes.value.has(nodeId);

  return `
    <div class="event-node expanded${isLoading ? " node-loading" : ""}"
         data-item-id="${nodeId}"
         data-kind="${kind}"
         data-author="${authorPubkey}">

      <!-- Titlebar matching profile card design -->
      <div class="event-titlebar" data-role="titlebar" style="background: ${kindColor};">
        <div class="event-left">
          <span class="event-badge">${typeLabel}</span>
          ${
            threadInfo.isReply
              ? '<span class="thread-indicator" title="Reply">↩️</span>'
              : ""
          }
          ${kind === 6 ? '<span class="thread-indicator" title="Repost">🔄</span>' : ""}
          <span class="event-title" title="${absoluteTime}">${timestamp}</span>
        </div>
        <div class="event-close" data-role="close">×</div>
      </div>

      <!-- Event Body -->
      <div class="event-body">
        <!-- Author Info -->
        <div class="event-author" data-author-pubkey="${authorPubkey}">
          <div class="author-avatar" style="background: ${kindColor};">👤</div>
          <div class="author-info">
            <div class="author-name" title="${authorPubkey}">${authorDisplay}</div>
          </div>
        </div>

        <!-- Content -->
        <div class="event-content markdown-content">
          ${bodyContent}
        </div>

        <!-- Tags -->
        ${
          tags.length > 0
            ? `
          <div class="event-tags">
            ${tags
              .map(
                (tag) =>
                  `<span class="tag-badge" data-tag="${safe(tag)}">#${safe(tag)}</span>`
              )
              .join("")}
          </div>
        `
            : ""
        }

        <!-- Mentions -->
        ${
          mentions.length > 0
            ? `
          <div class="event-mentions">
            <span class="mentions-label">Mentioned:</span>
            ${mentions
              .slice(0, 3)
              .map(
                (m) =>
                  `<span class="mention-badge" data-mention="${m.pubkey}" title="${
                    m.pubkey
                  }">@${m.pubkey.slice(0, 8)}...</span>`
              )
              .join("")}
            ${
              mentions.length > 3
                ? `<span class="mention-more">+${mentions.length - 3} more</span>`
                : ""
            }
          </div>
        `
            : ""
        }
      </div>

      <!-- Footer: Always visible engagement metrics -->
      <div class="event-footer">
        <div class="event-stats">
          <span class="stat-item${metrics.replies > 0 ? " has-count" : ""}"
                data-role="stat-replies"
                data-event-id="${nodeId}"
                title="Left-click: refresh | Right-click: expand/hide/update">
            💬 ${metrics.replies || 0}
          </span>
          <span class="stat-item${metrics.reactions > 0 ? " has-count" : ""}"
                data-role="stat-reactions"
                data-event-id="${nodeId}"
                title="Left-click: refresh | Right-click: expand/hide/update">
            ❤️ ${metrics.reactions || 0}
          </span>
          <span class="stat-item${metrics.reposts > 0 ? " has-count" : ""}"
                data-role="stat-reposts"
                data-event-id="${nodeId}"
                title="Left-click: refresh | Right-click: expand/hide/update">
            🔄 ${metrics.reposts || 0}
          </span>
          <span class="stat-item${mentionsCount > 0 ? " has-count" : ""}"
                data-role="stat-mentions"
                data-event-id="${nodeId}"
                title="Left-click: refresh | Right-click: expand/hide/update">
            🔗 ${mentionsCount || 0}
          </span>
          <span class="stat-item${hasThread ? " has-count" : ""}"
                data-role="stat-thread"
                data-event-id="${nodeId}"
                title="Left-click: refresh | Right-click: expand/hide/update">
            🧵 ${hasThread ? "•" : "○"}
          </span>
        </div>
      </div>

    </div>
  `;
}

function getEventTypeLabel(kind: number): string {
  const labels: Record<number, string> = {
    0: "👤 Profile",
    1: "📝 Note",
    3: "👥 Contacts",
    4: "💬 DM",
    5: "🗑️ Delete",
    6: "🔄 Repost",
    7: "❤️ Reaction",
    9735: "⚡ Zap",
    30023: "📄 Article",
  };
  return labels[kind] || `Kind ${kind}`;
}

// Tree layout helpers

// Check if a layout requires tree data structure
function isTreeLayout(layoutType: string): boolean {
  const treeLayouts = [
    "mindmap",
    "dendrogram",
    "compact-box",
    "indented",
    "dagre",
    "fishbone",
  ];
  return treeLayouts.includes(layoutType);
}

// Find best root node for tree layout
// Priority: 1) Previously set tree root, 2) Node with most outgoing edges, 3) Node with no incoming edges
function findBestRoot(nodes: any[], edges: any[]): string | null {
  if (nodes.length === 0) return null;

  // If there's a previously set tree root, use it
  if (treeRootId.value && nodes.some((n) => n.id === treeRootId.value)) {
    console.log("[Tree] Using previously set root:", treeRootId.value);
    return treeRootId.value;
  }

  // Count incoming and outgoing edges for each node
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  });

  edges.forEach((e) => {
    outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  // Find nodes with no incoming edges (potential roots)
  const rootCandidates = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);

  if (rootCandidates.length > 0) {
    // From root candidates, pick the one with most outgoing edges
    const bestRoot = rootCandidates.reduce((best, node) => {
      const bestOut = outDegree.get(best.id) || 0;
      const nodeOut = outDegree.get(node.id) || 0;
      return nodeOut > bestOut ? node : best;
    });
    console.log("[Tree] Found root node (no incoming edges):", bestRoot.id);
    return bestRoot.id;
  }

  // No clear root - pick node with best outgoing/incoming ratio
  const bestNode = nodes.reduce((best, node) => {
    const bestOut = outDegree.get(best.id) || 0;
    const nodeOut = outDegree.get(node.id) || 0;
    return nodeOut > bestOut ? node : best;
  });

  console.log("[Tree] Using node with most outgoing edges as root:", bestNode.id);
  return bestNode.id;
}

// Convert any graph to tree-compatible format for G6 layouts
// Creates a spanning tree that includes all nodes, handling cycles and disconnected components
function prepareTreeData(nodes: any[], edges: any[], rootId: string): { nodes: any[], edges: any[] } {
  console.log("[Tree] Preparing tree data with root:", rootId, "nodes:", nodes.length, "edges:", edges.length);

  // Build directed adjacency map for tree structure: parent -> children IDs
  const childrenMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  });

  // Build bidirectional adjacency map for finding connected components
  const adjacencyMap = new Map<string, string[]>();
  nodes.forEach(node => {
    adjacencyMap.set(node.id, []);
  });
  edges.forEach((edge) => {
    // Add edge in both directions for connectivity checking
    adjacencyMap.get(edge.source)!.push(edge.target);
    adjacencyMap.get(edge.target)!.push(edge.source);
  });

  // First pass: Find all nodes in the connected component containing the root
  // This uses bidirectional edges to ensure we find all connected nodes
  const connectedNodes = new Set<string>();
  const connectivityQueue: string[] = [rootId];

  while (connectivityQueue.length > 0) {
    const nodeId = connectivityQueue.shift()!;
    if (connectedNodes.has(nodeId)) continue;

    connectedNodes.add(nodeId);

    const neighbors = adjacencyMap.get(nodeId) || [];
    neighbors.forEach(neighborId => {
      if (!connectedNodes.has(neighborId)) {
        connectivityQueue.push(neighborId);
      }
    });
  }

  // Second pass: Build spanning tree using directed edges (for proper parent-child relationships)
  const depthMap = new Map<string, number>();
  const treeChildren = new Map<string, string[]>(); // Tree edges only (no cycles)
  const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;

    if (visited.has(id)) continue; // Skip already visited (breaks cycles)
    visited.add(id);
    depthMap.set(id, depth);

    const children = childrenMap.get(id) || [];
    const validChildren: string[] = [];

    children.forEach(childId => {
      if (!visited.has(childId)) {
        validChildren.push(childId);
        queue.push({ id: childId, depth: depth + 1 });
      }
    });

    if (validChildren.length > 0) {
      treeChildren.set(id, validChildren);
    }
  }

  // Find truly orphaned nodes (in disconnected components)
  const orphanedNodes: string[] = [];
  nodes.forEach(node => {
    if (!connectedNodes.has(node.id)) {
      orphanedNodes.push(node.id);
    }
  });

  // Find nodes that are connected but not visited by directed BFS
  // These need to be added to the tree using reverse edges
  const unvisitedConnected: string[] = [];
  connectedNodes.forEach(nodeId => {
    if (!visited.has(nodeId)) {
      unvisitedConnected.push(nodeId);
    }
  });

  // Add unvisited connected nodes to the tree by finding paths using bidirectional edges
  if (unvisitedConnected.length > 0) {
    console.log("[Tree] Found", unvisitedConnected.length, "connected but unreachable nodes (using bidirectional edges to add them)");

    unvisitedConnected.forEach(nodeId => {
      // Find a visited node that's adjacent to this unvisited node
      const neighbors = adjacencyMap.get(nodeId) || [];
      const visitedNeighbor = neighbors.find(n => visited.has(n));

      if (visitedNeighbor) {
        // Add this node as a child of a visited neighbor (check for duplicates)
        const existingChildren = treeChildren.get(visitedNeighbor) || [];
        if (!existingChildren.includes(nodeId)) {
          treeChildren.set(visitedNeighbor, [...existingChildren, nodeId]);
        }

        // Set depth one level deeper than the parent
        const parentDepth = depthMap.get(visitedNeighbor) || 0;
        depthMap.set(nodeId, parentDepth + 1);
        visited.add(nodeId);

        // Also check if this newly added node has children via directed edges
        const newNodeQueue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: parentDepth + 1 }];

        while (newNodeQueue.length > 0) {
          const { id, depth } = newNodeQueue.shift()!;
          const children = childrenMap.get(id) || [];
          const validChildren: string[] = [];

          children.forEach(childId => {
            if (!visited.has(childId) && connectedNodes.has(childId)) {
              validChildren.push(childId);
              visited.add(childId);
              depthMap.set(childId, depth + 1);
              newNodeQueue.push({ id: childId, depth: depth + 1 });
            }
          });

          if (validChildren.length > 0) {
            // Merge with existing children, avoiding duplicates
            const existing = treeChildren.get(id) || [];
            const merged = [...existing];
            validChildren.forEach(child => {
              if (!merged.includes(child)) {
                merged.push(child);
              }
            });
            treeChildren.set(id, merged);
          }
        }
      }
    });
  }

  // Create a virtual super-root if there are orphaned nodes (disconnected components)
  if (orphanedNodes.length > 0) {
    console.log("[Tree] Found", orphanedNodes.length, "orphaned nodes. Creating virtual super-root.");

    // Ensure rootId is not in orphanedNodes (should never happen, but safety check)
    const cleanOrphans = orphanedNodes.filter(id => id !== rootId);

    // Add virtual root
    const superRoot = {
      id: "__tree_super_root__",
      label: "🌳 Graph Root",
      data: {
        isVirtualRoot: true,
        kind: -1,
      },
      children: [rootId, ...cleanOrphans],
      depth: 0,
    };

    // Add main root and orphans as children of super-root
    treeChildren.set("__tree_super_root__", [rootId, ...cleanOrphans]);

    // Process orphaned nodes with BFS to find their subtrees
    cleanOrphans.forEach(orphanId => {
      const orphanQueue: Array<{ id: string; depth: number }> = [{ id: orphanId, depth: 1 }];

      while (orphanQueue.length > 0) {
        const { id, depth } = orphanQueue.shift()!;

        if (visited.has(id)) continue;
        visited.add(id);
        depthMap.set(id, depth);

        const children = childrenMap.get(id) || [];
        const validChildren: string[] = [];

        children.forEach(childId => {
          if (!visited.has(childId)) {
            validChildren.push(childId);
            orphanQueue.push({ id: childId, depth: depth + 1 });
          }
        });

        if (validChildren.length > 0) {
          treeChildren.set(id, validChildren);
        }
      }
    });

    // Increment all depths by 1 to make room for super-root
    const newDepthMap = new Map<string, number>();
    depthMap.forEach((depth, nodeId) => {
      newDepthMap.set(nodeId, depth + 1);
    });
    newDepthMap.set("__tree_super_root__", 0);

    // Deduplicate all children arrays in treeChildren to prevent duplicate edges
    const deduplicatedTreeChildren = new Map<string, string[]>();
    treeChildren.forEach((children, parent) => {
      deduplicatedTreeChildren.set(parent, Array.from(new Set(children)));
    });

    // Create enriched nodes including super-root (using deduplicated children)
    const enrichedNodes = [
      superRoot,
      ...nodes.map(node => ({
        ...node,
        children: deduplicatedTreeChildren.get(node.id) || [],
        depth: newDepthMap.get(node.id) ?? 0,
      }))
    ];

    // Build tree edges based on treeChildren relationships
    // Start with super-root edges
    const treeEdges: any[] = [
      { source: "__tree_super_root__", target: rootId, data: { type: "tree-structure" } },
      ...cleanOrphans.map(id => ({
        source: "__tree_super_root__",
        target: id,
        data: { type: "tree-structure" }
      }))
    ];

    // Track added edges to prevent duplicates and cycles
    const addedEdges = new Set<string>();
    treeEdges.forEach(e => addedEdges.add(`${e.source}->${e.target}`));

    // Add edges for all other parent-child relationships
    deduplicatedTreeChildren.forEach((children, parent) => {
      // Skip super-root edges (already added above)
      if (parent === "__tree_super_root__") return;

      children.forEach(child => {
        const edgeKey = `${parent}->${child}`;
        const reverseEdgeKey = `${child}->${parent}`;

        // Skip if we've already added this edge or its reverse (prevents cycles)
        if (addedEdges.has(edgeKey) || addedEdges.has(reverseEdgeKey)) {
          console.warn("[Tree] Skipping duplicate/reverse edge:", edgeKey);
          return;
        }

        // Validate: child should have greater depth than parent (no cycles)
        const parentDepth = newDepthMap.get(parent) ?? -1;
        const childDepth = newDepthMap.get(child) ?? -1;

        if (childDepth <= parentDepth && child !== "__tree_super_root__" && parent !== "__tree_super_root__") {
          console.warn("[Tree] Skipping edge with invalid depth:", parent, "→", child, "depths:", parentDepth, "→", childDepth);
          return;
        }

        addedEdges.add(edgeKey);

        // Look for an edge in either direction between parent and child
        const existingEdge = edges.find(e =>
          (e.source === parent && e.target === child) ||
          (e.source === child && e.target === parent)
        );

        if (existingEdge) {
          // Use existing edge but ensure correct direction (parent → child)
          treeEdges.push({
            ...existingEdge,
            source: parent,
            target: child,
          });
        } else {
          // Create synthetic edge if none exists
          treeEdges.push({
            source: parent,
            target: child,
            data: { type: "tree-structure" }
          });
        }
      });
    });

    console.log("[Tree] Created", treeEdges.length, "tree edges for", enrichedNodes.length, "nodes (with super-root)");

    // ALWAYS validate tree structure to prevent cycles (even if count is correct)
    // Build parent map and detect cycles by ensuring each node has at most one parent
    const parentMap = new Map<string, string>();
    const seenEdges = new Set<string>();
    const validEdges: any[] = [];

    treeEdges.forEach(edge => {
      const edgeKey = `${edge.source}->${edge.target}`;

      // Skip duplicates
      if (seenEdges.has(edgeKey)) {
        console.warn("[Tree] Removing duplicate edge:", edgeKey);
        return;
      }

      // Check for cycle: target should not already have a parent
      if (parentMap.has(edge.target)) {
        console.warn("[Tree] Removing edge that creates multiple parents:", edgeKey, "(target already has parent:", parentMap.get(edge.target), ")");
        return;
      }

      seenEdges.add(edgeKey);
      parentMap.set(edge.target, edge.source);
      validEdges.push(edge);
    });

    // Check if validation removed any edges
    if (validEdges.length !== treeEdges.length) {
      console.warn("[Tree] Removed", treeEdges.length - validEdges.length, "invalid edges. New count:", validEdges.length);
    }

    // Verify final edge count
    if (validEdges.length !== enrichedNodes.length - 1) {
      console.warn("[Tree] Invalid tree (super-root): expected", enrichedNodes.length - 1, "edges but got", validEdges.length);
    }

    // Update enriched nodes to match validated edges
    const validatedChildrenMap = new Map<string, string[]>();
    validEdges.forEach(edge => {
      const children = validatedChildrenMap.get(edge.source) || [];
      children.push(edge.target);
      validatedChildrenMap.set(edge.source, children);
    });

    const cleanedNodes = enrichedNodes.map(node => ({
      ...node,
      children: validatedChildrenMap.get(node.id) || [],
    }));

    console.log("[Tree] Returning validated tree with", cleanedNodes.length, "nodes and", validEdges.length, "edges");

    return {
      nodes: cleanedNodes,
      edges: validEdges,
    };
  }

  // No orphaned nodes - return simple tree

  // Deduplicate all children arrays in treeChildren to prevent duplicate edges
  const deduplicatedTreeChildren = new Map<string, string[]>();
  treeChildren.forEach((children, parent) => {
    deduplicatedTreeChildren.set(parent, Array.from(new Set(children)));
  });

  const enrichedNodes = nodes.map(node => ({
    ...node,
    children: deduplicatedTreeChildren.get(node.id) || [],
    depth: depthMap.get(node.id) ?? 0,
  }));

  // Build tree edges based on treeChildren relationships
  // For each parent-child relationship, find or create an edge
  // Add cycle detection to prevent infinite recursion
  const treeEdges: any[] = [];
  const addedEdges = new Set<string>(); // Track edges to prevent duplicates

  deduplicatedTreeChildren.forEach((children, parent) => {
    children.forEach(child => {
      const edgeKey = `${parent}->${child}`;
      const reverseEdgeKey = `${child}->${parent}`;

      // Skip if we've already added this edge or its reverse (prevents cycles)
      if (addedEdges.has(edgeKey) || addedEdges.has(reverseEdgeKey)) {
        console.warn("[Tree] Skipping duplicate/reverse edge:", edgeKey);
        return;
      }

      // Validate: child should have greater depth than parent (no cycles)
      const parentDepth = depthMap.get(parent) ?? -1;
      const childDepth = depthMap.get(child) ?? -1;

      if (childDepth <= parentDepth && child !== "__tree_super_root__" && parent !== "__tree_super_root__") {
        console.warn("[Tree] Skipping edge with invalid depth:", parent, "→", child, "depths:", parentDepth, "→", childDepth);
        return;
      }

      addedEdges.add(edgeKey);

      // Look for an edge in either direction between parent and child
      const existingEdge = edges.find(e =>
        (e.source === parent && e.target === child) ||
        (e.source === child && e.target === parent)
      );

      if (existingEdge) {
        // Use existing edge but ensure correct direction (parent → child)
        treeEdges.push({
          ...existingEdge,
          source: parent,
          target: child,
        });
      } else {
        // Create synthetic edge if none exists (shouldn't happen in connected graph)
        treeEdges.push({
          source: parent,
          target: child,
          data: { type: "tree-structure" }
        });
      }
    });
  });

  console.log("[Tree] Created", treeEdges.length, "tree edges for", enrichedNodes.length, "nodes");

  // ALWAYS validate tree structure to prevent cycles (even if count is correct)
  // Build parent map and detect cycles by ensuring each node has at most one parent
  const parentMap = new Map<string, string>();
  const seenEdges = new Set<string>();
  const validEdges: any[] = [];

  treeEdges.forEach(edge => {
    const edgeKey = `${edge.source}->${edge.target}`;

    // Skip duplicates
    if (seenEdges.has(edgeKey)) {
      console.warn("[Tree] Removing duplicate edge:", edgeKey);
      return;
    }

    // Check for cycle: target should not already have a parent
    if (parentMap.has(edge.target)) {
      console.warn("[Tree] Removing edge that creates multiple parents:", edgeKey, "(target already has parent:", parentMap.get(edge.target), ")");
      return;
    }

    seenEdges.add(edgeKey);
    parentMap.set(edge.target, edge.source);
    validEdges.push(edge);
  });

  // Check if validation removed any edges
  if (validEdges.length !== treeEdges.length) {
    console.warn("[Tree] Removed", treeEdges.length - validEdges.length, "invalid edges. New count:", validEdges.length);
  }

  // Verify final edge count
  if (validEdges.length !== enrichedNodes.length - 1) {
    console.warn("[Tree] Invalid tree: expected", enrichedNodes.length - 1, "edges but got", validEdges.length);
  }

  // Update enriched nodes to match validated edges
  const validatedChildrenMap = new Map<string, string[]>();
  validEdges.forEach(edge => {
    const children = validatedChildrenMap.get(edge.source) || [];
    children.push(edge.target);
    validatedChildrenMap.set(edge.source, children);
  });

  const cleanedNodes = enrichedNodes.map(node => ({
    ...node,
    children: validatedChildrenMap.get(node.id) || [],
  }));

  console.log("[Tree] Returning validated tree with", cleanedNodes.length, "nodes and", validEdges.length, "edges");

  return {
    nodes: cleanedNodes,
    edges: validEdges,
  };
}

// Helper: Get layout config based on layout type
function getLayoutConfig(type: string) {
  const settings = layoutSettings.value;

  // Helper: Get actual node size - always use card size for layout spacing
  // (Visual rendering stays small when collapsed, but layout reserves full card space)
  const getNodeSize = (_node: any) => {
    return Math.max(400, 300); // Use max dimension for radius calculations (always card size)
  };

  const getNodeWidth = (_node: any) => {
    return 400; // Always reserve card width
  };

  const getNodeHeight = (_node: any) => {
    return 300; // Always reserve card height
  };

  switch (type) {
    case "force":
      return {
        type: "force",
        center: [settings.force.centerX, settings.force.centerY],
        linkDistance: settings.force.linkDistance,
        edgeStrength: settings.force.edgeStrength,
        nodeStrength: settings.force.nodeStrength,
        preventOverlap: settings.force.preventOverlap,
        nodeSize: getNodeSize,
        nodeSpacing: settings.force.nodeSpacing,
        clustering: settings.force.clustering,
        clusterNodeStrength: settings.force.clusterNodeStrength,
        alpha: settings.force.alpha,
        alphaDecay: settings.force.alphaDecay,
        alphaMin: settings.force.alphaMin,
      };

    case "d3-force":
      return {
        type: "d3-force",
        link: {
          distance: settings.d3Force.linkDistance,
          strength: settings.d3Force.linkStrength,
          iterations: settings.d3Force.linkIterations,
        },
        manyBody: {
          strength: settings.d3Force.manyBodyStrength,
          theta: settings.d3Force.manyBodyTheta,
          distanceMin: settings.d3Force.manyBodyDistanceMin,
          distanceMax: settings.d3Force.manyBodyDistanceMax,
        },
        center: {
          x: settings.d3Force.centerX,
          y: settings.d3Force.centerY,
          strength: settings.d3Force.centerStrength,
        },
        collide: {
          radius: (node: any) => {
            const baseSize = getNodeSize(node);
            // Add collision radius offset to the actual node size
            return baseSize / 2 + settings.d3Force.collideRadius;
          },
          strength: settings.d3Force.collideStrength,
          iterations: settings.d3Force.collideIterations,
        },
        forceX: settings.d3Force.forceXEnabled
          ? {
              x: settings.d3Force.forceXX,
              strength: settings.d3Force.forceXStrength,
            }
          : undefined,
        forceY: settings.d3Force.forceYEnabled
          ? {
              y: settings.d3Force.forceYY,
              strength: settings.d3Force.forceYStrength,
            }
          : undefined,
        radial: settings.d3Force.radialEnabled
          ? {
              x: settings.d3Force.radialX,
              y: settings.d3Force.radialY,
              radius: settings.d3Force.radialRadius,
              strength: settings.d3Force.radialStrength,
            }
          : undefined,
        alpha: settings.d3Force.alpha,
        alphaMin: settings.d3Force.alphaMin,
        alphaDecay: settings.d3Force.alphaDecay,
        alphaTarget: settings.d3Force.alphaTarget,
        velocityDecay: settings.d3Force.velocityDecay,
      };

    case "circular":
      return {
        type: "circular",
        radius: settings.circular.radius,
        startRadius: settings.circular.startRadius,
        endRadius: settings.circular.endRadius,
        divisions: settings.circular.divisions,
        angleRatio: settings.circular.angleRatio,
        clockwise: settings.circular.clockwise,
        ordering: settings.circular.ordering,
        startAngle: settings.circular.startAngle,
        endAngle: settings.circular.endAngle,
        nodeSize: getNodeSize,
        nodeSpacing: settings.circular.nodeSpacing,
      };

    case "compact-box":
      return {
        type: "compact-box",
        direction: settings.compactBox.direction,
        getHeight: (node: any) => getNodeHeight(node),
        getWidth: (node: any) => getNodeWidth(node),
        getVGap: () => settings.compactBox.vGap,
        getHGap: () => settings.compactBox.hGap,
      };

    case "dagre":
      return {
        type: "dagre",
        rankdir: settings.dagre.rankdir,
        nodesep: settings.dagre.nodesep,
        ranksep: settings.dagre.ranksep,
      };

    case "concentric":
      return {
        type: "concentric",
        minNodeSpacing: settings.concentric.minNodeSpacing,
        preventOverlap: settings.concentric.preventOverlap,
        nodeSize: getNodeSize,
      };

    case "grid":
      return {
        type: "grid",
        rows: settings.grid.rows,
        cols: settings.grid.cols,
        preventOverlap: settings.grid.preventOverlap,
        nodeSize: getNodeSize,
      };

    case "radial":
      return {
        type: "radial",
        unitRadius: settings.radial.unitRadius,
        preventOverlap: settings.radial.preventOverlap,
        nodeSize: getNodeSize,
      };

    case "dendrogram":
      return {
        type: "dendrogram",
        direction: settings.dendrogram.direction,
        nodeSep: settings.dendrogram.nodeSep,
        rankSep: settings.dendrogram.rankSep,
        radial: settings.dendrogram.radial,
      };

    case "mindmap":
      return {
        type: "mindmap",
        direction: settings.mindmap.direction,
        getHGap: () => settings.mindmap.hGap,
        getVGap: () => settings.mindmap.vGap,
        getHeight: () => settings.mindmap.getHeight,
        getWidth: () => settings.mindmap.getWidth,
      };

    case "indented":
      return {
        type: "indented",
        indent: 80,
      };

    case "fruchterman":
      return {
        type: "fruchterman",
        center: [settings.fruchterman.centerX, settings.fruchterman.centerY],
        maxIteration: settings.fruchterman.maxIteration,
        gravity: settings.fruchterman.gravity,
        speed: settings.fruchterman.speed,
        clustering: settings.fruchterman.clustering,
        clusterGravity: settings.fruchterman.clusterGravity,
      };

    case "force-atlas2":
      return {
        type: "force-atlas2",
        kr: 100,
        kg: 1,
      };

    case "mds":
      return {
        type: "mds",
        linkDistance: settings.mds.linkDistance,
        center: [settings.mds.center.x, settings.mds.center.y],
      };

    case "fishbone":
      return {
        type: "fishbone",
        direction: layoutSettings.value.fishbone.direction,
        hGap: layoutSettings.value.fishbone.hGap,
        vGap: layoutSettings.value.fishbone.vGap,
      };

    case "random":
      return {
        type: "random",
      };

    default:
      return {
        type,
        preventOverlap: true,
      };
  }
}

// Apply layout settings
function applyLayoutSettings() {
  if (graph) {
    // Stop current layout to prevent glitches from multiple simultaneous animations
    graph.stopLayout();
    graph.setLayout(getLayoutConfig(layoutMode.value));
    graph.layout();
    isAnimating.value = true;
  }
}

// Watch for tree compatibility changes and switch layout if needed
watch(isTreeCompatible, (isTree) => {
  const currentOption = allLayoutOptions.find((opt) => opt.value === layoutMode.value);
  if (currentOption?.requiresTree && !isTree) {
    // Current layout requires tree but graph is not tree-compatible
    // Switch to a safe default layout
    layoutMode.value = "circular";
    showMessage("Graph structure changed - switched to circular layout", "info");
  }
});

// Context menu helper functions
function showContextMenu(
  x: number,
  y: number,
  title: string,
  actions: Array<{ label: string; icon: string; handler: () => void }>
) {
  contextMenu.value = { show: true, x, y, title, actions };
}

// Show multi-selection context menu
function showMultiSelectionContextMenu(x: number, y: number) {
  const count = selectedNodeIds.value.size;

  // Count node types in selection
  let authorCount = 0;
  let eventCount = 0;
  selectedNodeIds.value.forEach((nodeId: string) => {
    const nodeData = graph?.getNodeData(nodeId);
    if (nodeData?.data?.type === "pubkey") {
      authorCount++;
    } else {
      eventCount++;
    }
  });

  const actions = [
    {
      label: `Expand all (${count} nodes)`,
      icon: "mdi-arrow-expand-all",
      handler: () => {
        expandAllSelected();
        contextMenu.value.show = false;
      },
    },
    {
      label: `Collapse all (${count} nodes)`,
      icon: "mdi-arrow-collapse-all",
      handler: () => {
        collapseAllSelected();
        contextMenu.value.show = false;
      },
    },
  ];

  // Add author-specific actions if any authors are selected
  if (authorCount > 0) {
    actions.push(
      {
        label: `Expand posts (${authorCount} authors)`,
        icon: "mdi-post-outline",
        handler: () => {
          expandPostsBySelectedAuthors();
          contextMenu.value.show = false;
        },
      },
      {
        label: `Expand articles (${authorCount} authors)`,
        icon: "mdi-book-open",
        handler: () => {
          expandArticlesBySelectedAuthors();
          contextMenu.value.show = false;
        },
      },
      {
        label: `Expand network (${authorCount} authors)`,
        icon: "mdi-account-group",
        handler: () => {
          expandNetworkForSelectedAuthors();
          contextMenu.value.show = false;
        },
      }
    );
  }

  actions.push(
    {
      label: `Copy all IDs (${count})`,
      icon: "mdi-content-copy",
      handler: () => {
        copySelectedIds();
        contextMenu.value.show = false;
      },
    },
    {
      label: `Remove all (${count} nodes)`,
      icon: "mdi-delete",
      handler: () => {
        removeAllSelected();
        contextMenu.value.show = false;
      },
    }
  );

  const title = `${count} nodes selected${authorCount > 0 ? ` (${authorCount} authors, ${eventCount} events)` : ''}`;
  showContextMenu(x, y, title, actions);
}

// Make a node the root for tree layouts
function makeTreeRoot(nodeId: string) {
  console.log("[Tree] Setting new root node:", nodeId);
  treeRootId.value = nodeId;

  // If we're currently in a tree layout, rebuild the tree with new root
  if (isTreeLayout(layoutMode.value) && graph && originalGraphData.value) {
    const nodes = originalGraphData.value.nodes;
    const edges = originalGraphData.value.edges;
    const treeData = prepareTreeData(nodes, edges, nodeId);

    graph.setData(treeData);
    graph.layout();
    graph.render();

    setTimeout(() => {
      graph.fitView();
    }, 500);
  }

  contextMenu.value.show = false;
}

// Show stat context menu (right-click on stat)
function showStatContextMenu(x: number, y: number, eventId: string, statType: StatType) {
  const labels = {
    reactions: "Reactions",
    replies: "Replies",
    reposts: "Reposts",
    mentions: "Mentions",
    thread: "Thread",
  };

  const icons = {
    reactions: "mdi-heart",
    replies: "mdi-comment",
    reposts: "mdi-repeat",
    mentions: "mdi-at",
    thread: "mdi-message-outline",
  };

  // Check if this stat is already expanded
  const isExpanded = expandedStats.value.get(eventId)?.has(statType) || false;

  const actions = [];

  if (!isExpanded) {
    actions.push({
      label: `Expand ${labels[statType]}`,
      icon: icons[statType],
      handler: () => handleExpandStat(eventId, statType),
    });
  } else {
    actions.push({
      label: `Hide ${labels[statType]}`,
      icon: "mdi-eye-off",
      handler: () => handleHideStat(eventId, statType),
    });
  }

  actions.push({
    label: `Update ${labels[statType]}`,
    icon: "mdi-refresh",
    handler: () => handleRefreshStat(eventId, statType),
  });

  showContextMenu(x, y, labels[statType], actions);
}

// Helper: Create or get author node
function createAuthorNode(pubkey: string, profile?: any, createdAt?: number) {
  // Check if author node already exists
  const existingNode = graphStore.nodes.find((n: any) => n.id === pubkey);
  if (existingNode) {
    // Update profile if provided
    if (profile) {
      existingNode.data.profile = profile;
      existingNode.label = `👤 ${
        profile.name || profile.display_name || pubkey.slice(0, 8)
      }`;
    }
    // Update created_at if provided and not already set
    if (createdAt && !existingNode.data.created_at) {
      existingNode.data.created_at = createdAt;
    }
    return pubkey;
  }

  // Create new author node
  const displayName = profile?.name || profile?.display_name || pubkey.slice(0, 8);
  const authorNode = {
    id: pubkey,
    label: `👤 ${displayName}`,
    data: {
      type: "pubkey",
      pubkey: pubkey,
      profile: profile || null,
      created_at: createdAt || null, // Store kind 0 event timestamp for timebar
    },
  };

  graphStore.addNode(authorNode);
  return pubkey;
}

// Helper: Connect events to author node
function connectEventsToAuthor(pubkey: string) {
  const edges: any[] = [];

  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    if (!event) return;

    // Check if this event is by this author
    if (event.pubkey === pubkey) {
      // Create edge from author to event (author created it)
      const edge = {
        source: pubkey,
        target: event.id,
        data: {
          type: "authored-by",
        },
      };
      edges.push(edge);
    }
  });

  edges.forEach((edge) => graphStore.addEdge(edge));
  return edges.length;
}

// Helper: Connect events that mention this pubkey
function connectMentionsToAuthor(pubkey: string) {
  const edges: any[] = [];

  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    if (!event) return;

    // Check if this event mentions this pubkey (has a 'p' tag)
    const mentions = event.tags?.filter(
      (tag: any) => tag[0] === "p" && tag[1] === pubkey
    );

    if (mentions && mentions.length > 0) {
      // Create edge from event to mentioned author
      const edge = {
        source: event.id,
        target: pubkey,
        data: {
          type: "mention",
          pubkey: pubkey,
        },
      };
      edges.push(edge);
    }
  });

  edges.forEach((edge) => graphStore.addEdge(edge));
  return edges.length;
}

// Helper: Create or get tag node
function createTagNode(tag: string) {
  const tagNodeId = `tag:${tag.toLowerCase()}`;

  // Check if tag node already exists
  const existingNode = graphStore.nodes.find((n: any) => n.id === tagNodeId);
  if (existingNode) {
    return tagNodeId;
  }

  // Create new tag node
  const tagNode = {
    id: tagNodeId,
    label: `#${tag}`,
    data: {
      type: "tag",
      tag: tag,
      color: "#f59e0b",
    },
  };

  graphStore.addNode(tagNode);
  return tagNodeId;
}

// Helper: Connect events with tag to tag node
function connectEventsToTag(tag: string, tagNodeId: string) {
  const edges: any[] = [];

  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    if (!event) return;

    // Check if this event has the tag
    const hasTag = event.tags?.some(
      (t: string[]) => t[0] === "t" && t[1]?.toLowerCase() === tag.toLowerCase()
    );

    if (hasTag) {
      // Create edge from event to tag node
      const edge = {
        source: event.id,
        target: tagNodeId,
        data: {
          type: "has-tag",
        },
      };
      edges.push(edge);
    }
  });

  // Add all edges
  edges.forEach((edge) => graphStore.addEdge(edge));
  return edges.length;
}

// Expansion functions
async function expandByTag(tag: string) {
  contextMenu.value.show = false;
  showMessage(`Expanding posts with #${tag}...`, "info");

  try {
    // Create tag node
    const tagNodeId = createTagNode(tag);

    // Fetch events with this t-tag
    const events = await fetchInitialEvents([
      { "#t": [tag.toLowerCase()], kinds: [1, 30023], limit: 50 },
    ]);

    if (events.length > 0) {
      graphStore.updateWithEvents(events);

      // Connect all events (new and existing) to tag node
      const connectedCount = connectEventsToTag(tag, tagNodeId);

      showMessage(
        `Added ${events.length} posts with #${tag} (${connectedCount} connections)`,
        "success"
      );
    } else {
      // Still create connections to existing events
      const connectedCount = connectEventsToTag(tag, tagNodeId);
      showMessage(
        `No new posts found, but connected ${connectedCount} existing posts to #${tag}`,
        "info"
      );
    }
  } catch (error) {
    console.error("Failed to expand tag posts:", error);
    showMessage("Failed to expand tag posts", "error");
  }
}

async function expandAuthorPosts(pubkey: string) {
  contextMenu.value.show = false;
  showMessage(`Expanding posts by ${pubkey.slice(0, 8)}...`, "info");

  try {
    const events = await fetchByAuthor(pubkey, 50);
    const notes = events.filter((e) => e.kind === 1);

    if (notes.length > 0) {
      graphStore.updateWithEvents(notes);
      // Create author node and connect all events by this author
      createAuthorNode(pubkey);
      const connectedCount = connectEventsToAuthor(pubkey);
      const mentionCount = connectMentionsToAuthor(pubkey);
      showMessage(
        `Added ${notes.length} posts (${connectedCount} authored, ${mentionCount} mentioned)`,
        "success"
      );
    } else {
      // Still create author node even if no new posts
      createAuthorNode(pubkey);
      const connectedCount = connectEventsToAuthor(pubkey);
      const mentionCount = connectMentionsToAuthor(pubkey);
      showMessage(
        `No new posts (${connectedCount} authored, ${mentionCount} mentioned)`,
        "info"
      );
    }
  } catch (error) {
    console.error("Failed to expand author posts:", error);
    showMessage("Failed to expand author posts", "error");
  }
}

async function expandAuthorArticles(pubkey: string) {
  contextMenu.value.show = false;
  showMessage(`Expanding articles by ${pubkey.slice(0, 8)}...`, "info");

  try {
    const events = await fetchInitialEvents([
      { authors: [pubkey], kinds: [30023], limit: 20 },
    ]);

    if (events.length > 0) {
      graphStore.updateWithEvents(events);
      // Create author node and connect all events by this author
      createAuthorNode(pubkey);
      const connectedCount = connectEventsToAuthor(pubkey);
      const mentionCount = connectMentionsToAuthor(pubkey);
      showMessage(
        `Added ${events.length} articles (${connectedCount} authored, ${mentionCount} mentioned)`,
        "success"
      );
    } else {
      // Still create author node even if no new articles
      createAuthorNode(pubkey);
      const connectedCount = connectEventsToAuthor(pubkey);
      const mentionCount = connectMentionsToAuthor(pubkey);
      showMessage(
        `No new articles (${connectedCount} authored, ${mentionCount} mentioned)`,
        "info"
      );
    }
  } catch (error) {
    console.error("Failed to expand author articles:", error);
    showMessage("Failed to expand author articles", "error");
  }
}

async function expandAuthorProfile(pubkey: string) {
  contextMenu.value.show = false;
  showMessage(`Fetching profile for ${pubkey.slice(0, 8)}...`, "info");

  try {
    const events = await fetchInitialEvents([
      { authors: [pubkey], kinds: [0], limit: 1 },
    ]);

    if (events.length > 0) {
      // Parse profile data
      let profile = null;
      try {
        profile = JSON.parse(events[0].content);
      } catch (e) {
        console.warn("Failed to parse profile:", e);
      }

      // Create/update author node with profile data and timestamp
      createAuthorNode(pubkey, profile, events[0].created_at);
      const connectedCount = connectEventsToAuthor(pubkey);
      const mentionCount = connectMentionsToAuthor(pubkey);
      showMessage(
        `Profile loaded (${connectedCount} authored, ${mentionCount} mentioned)`,
        "success"
      );
    } else {
      // Create author node without profile
      createAuthorNode(pubkey);
      const connectedCount = connectEventsToAuthor(pubkey);
      const mentionCount = connectMentionsToAuthor(pubkey);
      showMessage(
        `Profile not found (${connectedCount} authored, ${mentionCount} mentioned)`,
        "info"
      );
    }
  } catch (error) {
    console.error("Failed to fetch author profile:", error);
    showMessage("Failed to fetch author profile", "error");
  }
}

async function expandAuthorNetwork(pubkey: string) {
  contextMenu.value.show = false;
  showMessage(`Expanding social network for ${pubkey.slice(0, 8)}...`, "info");

  try {
    const { follows, events } = await fetchUserGraph(pubkey);

    if (events.length > 0) {
      graphStore.updateWithEvents(events);
      // Create author node and connect events
      createAuthorNode(pubkey);
      const connectedCount = connectEventsToAuthor(pubkey);
      const mentionCount = connectMentionsToAuthor(pubkey);
      showMessage(
        `Added ${events.length} events from network (${follows.length} contacts, ${connectedCount} authored, ${mentionCount} mentioned)`,
        "success"
      );
    } else {
      // Still create author node
      createAuthorNode(pubkey);
      const connectedCount = connectEventsToAuthor(pubkey);
      const mentionCount = connectMentionsToAuthor(pubkey);
      showMessage(
        `No new network data (${connectedCount} authored, ${mentionCount} mentioned)`,
        "info"
      );
    }
  } catch (error) {
    console.error("Failed to expand social network:", error);
    showMessage("Failed to expand social network", "error");
  }
}

async function expandOriginalPost(eventId: string) {
  contextMenu.value.show = false;
  showMessage("Finding original post...", "info");

  try {
    // Get the current event to find what it references
    const currentNode = graphStore.nodes.find((n) => n.id === eventId);
    if (!currentNode?.data?.event) {
      showMessage("Event not found in graph", "warning");
      return;
    }

    const event = currentNode.data.event;
    const eTag = event.tags.find((t: string[]) => t[0] === "e");

    if (eTag && eTag[1]) {
      const referencedId = eTag[1];
      const events = await fetchInitialEvents([{ ids: [referencedId] }]);

      if (events.length > 0) {
        graphStore.updateWithEvents(events);
        showMessage("Original post added", "success");
      } else {
        showMessage("Original post not found", "info");
      }
    } else {
      showMessage("No referenced post found", "warning");
    }
  } catch (error) {
    console.error("Failed to find original post:", error);
    showMessage("Failed to find original post", "error");
  }
}

// Handler functions for stat interactions

// Refresh stat count (left-click)
async function handleRefreshStat(eventId: string, statType: StatType) {
  contextMenu.value.show = false;

  if (statType === "reactions") {
    await handleRefreshReactions(eventId);
  } else if (statType === "replies") {
    await handleRefreshReplies(eventId);
  } else if (statType === "reposts") {
    await handleRefreshReposts(eventId);
  } else if (statType === "mentions") {
    await handleRefreshMentions(eventId);
  } else if (statType === "thread") {
    await handleRefreshThread(eventId);
  }
}

// Expand stat (right-click > Expand)
async function handleExpandStat(eventId: string, statType: StatType) {
  contextMenu.value.show = false;

  // Mark as expanded
  if (!expandedStats.value.has(eventId)) {
    expandedStats.value.set(eventId, new Set());
  }
  expandedStats.value.get(eventId)!.add(statType);

  if (statType === "reactions") {
    await handleExpandReactions(eventId);
  } else if (statType === "replies") {
    await handleExpandReplies(eventId);
  } else if (statType === "reposts") {
    await handleExpandReposts(eventId);
  } else if (statType === "mentions") {
    await handleExpandMentions(eventId);
  } else if (statType === "thread") {
    await handleExpandThread(eventId);
  }
}

// Hide stat nodes (right-click > Hide)
function handleHideStat(eventId: string, statType: StatType) {
  contextMenu.value.show = false;

  // Mark as not expanded
  expandedStats.value.get(eventId)?.delete(statType);

  // Remove nodes related to this stat type
  const nodesToRemove: string[] = [];

  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    if (!event) return;

    // Check if this node is related to the stat type
    const eTags = event.tags?.filter((t: string[]) => t[0] === "e") || [];
    const referencesEvent = eTags.some((t: string[]) => t[1] === eventId);

    if (referencesEvent) {
      if (statType === "reactions" && event.kind === 7) {
        nodesToRemove.push(node.id);
      } else if (statType === "replies" && (event.kind === 1 || event.kind === 30023)) {
        nodesToRemove.push(node.id);
      } else if (statType === "reposts" && event.kind === 6) {
        nodesToRemove.push(node.id);
      } else if (statType === "mentions") {
        // For mentions, check if this event was mentioned in the source event's tags
        const sourceNode = graphStore.nodes.find((n: any) => n.id === eventId);
        if (sourceNode?.data?.event) {
          const mentionedIds = sourceNode.data.event.tags
            .filter((t: string[]) => t[0] === "e")
            .map((t: string[]) => t[1]);
          if (mentionedIds.includes(event.id)) {
            nodesToRemove.push(node.id);
          }
        }
      }
    }

    // For thread, remove parent and replies
    if (statType === "thread") {
      // Check if this is a parent or reply
      const isParentOf = event.tags?.some(
        (t: string[]) => t[0] === "e" && t[1] === eventId
      );
      const sourceEvent = graphStore.nodes.find((n: any) => n.id === eventId)?.data
        ?.event;
      const isChildOf = sourceEvent?.tags?.some(
        (t: string[]) => t[0] === "e" && t[1] === event.id
      );

      if (isParentOf || isChildOf) {
        nodesToRemove.push(node.id);
      }
    }
  });

  // Remove nodes and their edges
  nodesToRemove.forEach((nodeId) => {
    graphStore.removeNode(nodeId);
  });

  showMessage(`Hidden ${nodesToRemove.length} ${statType} nodes`, "success");
}

// Refresh handlers (fetch new count, update graph if expanded)
async function handleRefreshReactions(eventId: string) {
  expandingNodes.value.add(eventId);
  showMessage("Refreshing reactions...", "info");

  try {
    const events = await expandReactions(eventId);

    // If expanded, update graph
    const isExpanded = expandedStats.value.get(eventId)?.has("reactions");
    if (isExpanded && events.length > 0) {
      graphStore.updateWithEvents(events);
      showMessage(`Updated ${events.length} reactions`, "success");
    } else {
      showMessage(`Found ${events.length} reactions`, "info");
      // Trigger re-render to update count
      if (graph) graph.render();
    }
  } catch (error) {
    console.error("Failed to refresh reactions:", error);
    showMessage("Failed to refresh reactions", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

async function handleRefreshReplies(eventId: string) {
  expandingNodes.value.add(eventId);
  showMessage("Refreshing replies...", "info");

  try {
    const events = await expandReplies(eventId);

    const isExpanded = expandedStats.value.get(eventId)?.has("replies");
    if (isExpanded && events.length > 0) {
      graphStore.updateWithEvents(events);
      showMessage(`Updated ${events.length} replies`, "success");
    } else {
      showMessage(`Found ${events.length} replies`, "info");
      if (graph) graph.render();
    }
  } catch (error) {
    console.error("Failed to refresh replies:", error);
    showMessage("Failed to refresh replies", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

async function handleRefreshReposts(eventId: string) {
  expandingNodes.value.add(eventId);
  showMessage("Refreshing reposts...", "info");

  try {
    const events = await expandReposts(eventId);

    const isExpanded = expandedStats.value.get(eventId)?.has("reposts");
    if (isExpanded && events.length > 0) {
      graphStore.updateWithEvents(events);
      showMessage(`Updated ${events.length} reposts`, "success");
    } else {
      showMessage(`Found ${events.length} reposts`, "info");
      if (graph) graph.render();
    }
  } catch (error) {
    console.error("Failed to refresh reposts:", error);
    showMessage("Failed to refresh reposts", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

async function handleRefreshMentions(eventId: string) {
  expandingNodes.value.add(eventId);
  showMessage("Refreshing mentions...", "info");

  try {
    const events = await expandMentions(eventId);

    const isExpanded = expandedStats.value.get(eventId)?.has("mentions");
    if (isExpanded && events.length > 0) {
      graphStore.updateWithEvents(events);
      showMessage(`Updated ${events.length} mentions`, "success");
    } else {
      showMessage(`Found ${events.length} mentions`, "info");
      if (graph) graph.render();
    }
  } catch (error) {
    console.error("Failed to refresh mentions:", error);
    showMessage("Failed to refresh mentions", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

async function handleRefreshThread(eventId: string) {
  expandingNodes.value.add(eventId);
  showMessage("Refreshing thread...", "info");

  try {
    const { parent, replies } = await expandThread(eventId);
    const allEvents = [...(parent ? [parent] : []), ...replies];

    const isExpanded = expandedStats.value.get(eventId)?.has("thread");
    if (isExpanded && allEvents.length > 0) {
      graphStore.updateWithEvents(allEvents);
      const parts = [];
      if (parent) parts.push("parent");
      if (replies.length > 0) parts.push(`${replies.length} replies`);
      showMessage(`Updated ${parts.join(" and ")}`, "success");
    } else {
      showMessage(`Found ${allEvents.length} thread events`, "info");
      if (graph) graph.render();
    }
  } catch (error) {
    console.error("Failed to refresh thread:", error);
    showMessage("Failed to refresh thread", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

// Expand handlers (add to graph and mark as expanded)
async function handleExpandReactions(eventId: string) {
  contextMenu.value.show = false;
  expandingNodes.value.add(eventId);
  showMessage("Expanding reactions...", "info");

  try {
    const events = await expandReactions(eventId);

    if (events.length > 0) {
      graphStore.updateWithEvents(events);
      showMessage(`Added ${events.length} reactions`, "success");
    } else {
      showMessage("No reactions found", "info");
    }
  } catch (error) {
    console.error("Failed to expand reactions:", error);
    showMessage("Failed to expand reactions", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

async function handleExpandReplies(eventId: string) {
  contextMenu.value.show = false;
  expandingNodes.value.add(eventId);
  showMessage("Expanding replies...", "info");

  try {
    const events = await expandReplies(eventId);

    if (events.length > 0) {
      graphStore.updateWithEvents(events);
      showMessage(`Added ${events.length} replies`, "success");
    } else {
      showMessage("No replies found", "info");
    }
  } catch (error) {
    console.error("Failed to expand replies:", error);
    showMessage("Failed to expand replies", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

async function handleExpandReposts(eventId: string) {
  contextMenu.value.show = false;
  expandingNodes.value.add(eventId);
  showMessage("Expanding reposts...", "info");

  try {
    const events = await expandReposts(eventId);

    if (events.length > 0) {
      graphStore.updateWithEvents(events);
      showMessage(`Added ${events.length} reposts`, "success");
    } else {
      showMessage("No reposts found", "info");
    }
  } catch (error) {
    console.error("Failed to expand reposts:", error);
    showMessage("Failed to expand reposts", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

async function handleExpandMentions(eventId: string) {
  contextMenu.value.show = false;
  expandingNodes.value.add(eventId);
  showMessage("Expanding mentions...", "info");

  try {
    const events = await expandMentions(eventId);

    if (events.length > 0) {
      graphStore.updateWithEvents(events);
      showMessage(`Added ${events.length} mentions`, "success");
    } else {
      showMessage("No mentions found", "info");
    }
  } catch (error) {
    console.error("Failed to expand mentions:", error);
    showMessage("Failed to expand mentions", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

async function handleExpandThread(eventId: string) {
  contextMenu.value.show = false;
  expandingNodes.value.add(eventId);
  showMessage("Expanding thread...", "info");

  try {
    const { parent, replies } = await expandThread(eventId);
    const allEvents = [...(parent ? [parent] : []), ...replies];

    if (allEvents.length > 0) {
      graphStore.updateWithEvents(allEvents);
      const parts = [];
      if (parent) parts.push("parent");
      if (replies.length > 0) parts.push(`${replies.length} replies`);
      showMessage(`Added ${parts.join(" and ")}`, "success");
    } else {
      showMessage("No thread context found", "info");
    }
  } catch (error) {
    console.error("Failed to expand thread:", error);
    showMessage("Failed to expand thread", "error");
  } finally {
    expandingNodes.value.delete(eventId);
  }
}

// Filter functions
function filterByTag(tag: string) {
  contextMenu.value.show = false;
  showMessage(`Filtering to show only #${tag}`, "info");

  if (!graph) return;

  // Create tag node
  const tagNodeId = createTagNode(tag);

  // Connect all events with this tag to the tag node
  const connectedCount = connectEventsToTag(tag, tagNodeId);

  // Use visibility property to hide/show nodes
  const updates: any[] = [];
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    const isTagNode = node.data?.type === "tag";
    const hasTags = event?.tags?.some(
      (t: string[]) => t[0] === "t" && t[1]?.toLowerCase() === tag.toLowerCase()
    );

    updates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: hasTags || isTagNode ? "visible" : "hidden",
      },
    });
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
  }

  showMessage(`Filtered to #${tag} (${connectedCount} connections)`, "success");
}

function filterByAuthor(pubkey: string) {
  contextMenu.value.show = false;
  showMessage(`Filtering to show only ${pubkey.slice(0, 8)}...`, "info");

  if (!graph) return;

  // Use visibility property to hide/show nodes
  const updates: any[] = [];
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    updates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: event?.pubkey === pubkey ? "visible" : "hidden",
      },
    });
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
  }

  showMessage("Filtered to author", "success");
}

function filterRelated(eventId: string) {
  contextMenu.value.show = false;
  showMessage("Filtering to show related content...", "info");

  if (!graph) return;

  // Find all connected nodes (1 hop away)
  const connectedIds = new Set<string>([eventId]);
  graphStore.edges.forEach((edge: any) => {
    if (edge.source === eventId) connectedIds.add(edge.target);
    if (edge.target === eventId) connectedIds.add(edge.source);
  });

  // Use visibility to hide unconnected nodes
  const updates: any[] = [];
  graphStore.nodes.forEach((node: any) => {
    updates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: connectedIds.has(node.id) ? "visible" : "hidden",
      },
    });
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
  }

  showMessage(`Showing ${connectedIds.size} related nodes`, "success");
}

// Highlight functions
function highlightByTag(tag: string) {
  contextMenu.value.show = false;
  showMessage(`Highlighting posts with #${tag}`, "info");

  if (!graph) return;

  // Add highlight style to matching nodes
  const updates: any[] = [];

  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    const hasTags = event?.tags?.some(
      (t: string[]) => t[0] === "t" && t[1]?.toLowerCase() === tag.toLowerCase()
    );

    if (hasTags) {
      updates.push({
        id: node.id,
        style: {
          ...node.style,
          stroke: "#fbbf24",
          lineWidth: 4,
        },
      });
    } else {
      // Reset to default style
      updates.push({
        id: node.id,
        style: {
          ...node.style,
          stroke: undefined,
          lineWidth: undefined,
        },
      });
    }
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
  }

  showMessage(`Highlighted #${tag}`, "success");
}

function highlightByAuthor(pubkey: string) {
  contextMenu.value.show = false;
  showMessage(`Highlighting content by ${pubkey.slice(0, 8)}...`, "info");

  if (!graph) return;

  // Add highlight style to author's nodes
  const updates: any[] = [];

  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    if (event?.pubkey === pubkey) {
      updates.push({
        id: node.id,
        style: {
          ...node.style,
          stroke: "#8b5cf6",
          lineWidth: 4,
        },
      });
    } else {
      // Reset to default style
      updates.push({
        id: node.id,
        style: {
          ...node.style,
          stroke: undefined,
          lineWidth: undefined,
        },
      });
    }
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
  }

  showMessage("Highlighted author", "success");
}

// Clear all filters - show all nodes
function clearFilters() {
  if (!graph) return;

  // Don't clear search - it's independent
  // Only clear other filters (visibility from filterBy* functions)

  const updates: any[] = [];
  graphStore.nodes.forEach((node: any) => {
    // If search is active, preserve search visibility state
    // Otherwise, make all nodes visible
    const visibility = searchActive.value
      ? searchResults.value.has(node.id)
        ? "visible"
        : "hidden"
      : "visible";

    updates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: visibility,
      },
    });
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
  }

  const message = searchActive.value
    ? "Filters cleared (search still active)"
    : "All filters cleared";
  showMessage(message, "success");
}

// Reset all highlights - remove custom styles
function resetHighlights() {
  if (!graph) return;

  // Don't clear search - only remove highlight styles
  // Search has its own clear button

  const updates: any[] = [];

  graphStore.nodes.forEach((node: any) => {
    updates.push({
      id: node.id,
      style: {
        ...node.style,
        stroke: undefined,
        lineWidth: undefined,
      },
    });
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
  }

  showMessage("Highlights cleared", "success");
}

// Search Functions
// ================

// Perform local search on current graph
function performSearch() {
  if (!graph || !searchQuery.value.trim()) {
    clearSearch();
    return;
  }

  const queryText = searchQuery.value.trim();
  const parsedFilter = parseNostrQuery(queryText);
  const searchText = parsedFilter.search?.toLowerCase() || "";

  console.log("[Local Search] Parsed filter:", parsedFilter);

  const matchingNodeIds = new Set<string>();

  // Search through all nodes
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event;
    if (!event) {
      // Check if it's an author/tag node
      if (node.data?.type === "pubkey") {
        const pubkey = node.data?.pubkey || "";
        const profile = node.data?.profile;
        const name = profile?.name || profile?.display_name || "";

        // Check author filter
        if (parsedFilter.authors && parsedFilter.authors.length > 0) {
          if (parsedFilter.authors.some(a => pubkey.toLowerCase().includes(a.toLowerCase()))) {
            matchingNodeIds.add(node.id);
            return;
          }
        }

        // Check search text
        if (searchText && (pubkey.toLowerCase().includes(searchText) || name.toLowerCase().includes(searchText))) {
          matchingNodeIds.add(node.id);
        }
      } else if (node.data?.type === "tag") {
        const tag = node.data?.tag || "";

        // Check tag filter
        if (parsedFilter['#t'] && parsedFilter['#t'].length > 0) {
          if (parsedFilter['#t'].some((t: string) => tag.toLowerCase().includes(t.toLowerCase()))) {
            matchingNodeIds.add(node.id);
            return;
          }
        }

        // Check search text
        if (searchText && tag.toLowerCase().includes(searchText)) {
          matchingNodeIds.add(node.id);
        }
      }
      return;
    }

    let matches = false;

    // Check kind filter
    if (parsedFilter.kinds && parsedFilter.kinds.length > 0) {
      if (!parsedFilter.kinds.includes(event.kind)) {
        return; // Skip if kind doesn't match
      }
    }

    // Check author filter
    if (parsedFilter.authors && parsedFilter.authors.length > 0) {
      if (parsedFilter.authors.some(a => event.pubkey?.toLowerCase().includes(a.toLowerCase()))) {
        matches = true;
      } else {
        return; // Skip if author doesn't match
      }
    }

    // Check ID filter
    if (parsedFilter.ids && parsedFilter.ids.length > 0) {
      if (parsedFilter.ids.some(id => event.id?.toLowerCase().includes(id.toLowerCase()))) {
        matches = true;
      } else {
        return; // Skip if ID doesn't match
      }
    }

    // Check hashtag filter (#t)
    if (parsedFilter['#t'] && parsedFilter['#t'].length > 0) {
      const eventHashtags = event.tags?.filter((t: string[]) => t[0] === 't').map((t: string[]) => t[1]?.toLowerCase()) || [];
      if (parsedFilter['#t'].some((tag: string) => eventHashtags.includes(tag.toLowerCase()))) {
        matches = true;
      } else if (!searchText) {
        return; // Skip if hashtag doesn't match and no search text
      }
    }

    // Check mention filter (#p)
    if (parsedFilter['#p'] && parsedFilter['#p'].length > 0) {
      const eventMentions = event.tags?.filter((t: string[]) => t[0] === 'p').map((t: string[]) => t[1]?.toLowerCase()) || [];
      if (parsedFilter['#p'].some((pubkey: string) => eventMentions.some(m => m.includes(pubkey.toLowerCase())))) {
        matches = true;
      } else if (!searchText) {
        return; // Skip if mention doesn't match and no search text
      }
    }

    // Check event reference filter (#e)
    if (parsedFilter['#e'] && parsedFilter['#e'].length > 0) {
      const eventRefs = event.tags?.filter((t: string[]) => t[0] === 'e').map((t: string[]) => t[1]?.toLowerCase()) || [];
      if (parsedFilter['#e'].some((eventId: string) => eventRefs.includes(eventId.toLowerCase()))) {
        matches = true;
      } else if (!searchText) {
        return; // Skip if event ref doesn't match and no search text
      }
    }

    // Check time filters
    if (parsedFilter.since && event.created_at < parsedFilter.since) {
      return; // Skip if too old
    }
    if (parsedFilter.until && event.created_at > parsedFilter.until) {
      return; // Skip if too new
    }

    // Check search text in content
    if (searchText) {
      if (event.content?.toLowerCase().includes(searchText)) {
        matches = true;
      }

      // Search all tags
      if (!matches && event.tags) {
        const hasMatchingTag = event.tags.some((t: string[]) =>
          t.some((val: string) => val?.toLowerCase().includes(searchText))
        );
        if (hasMatchingTag) matches = true;
      }

      // Search author pubkey
      if (!matches && event.pubkey?.toLowerCase().includes(searchText)) {
        matches = true;
      }

      // Search event ID
      if (!matches && event.id?.toLowerCase().includes(searchText)) {
        matches = true;
      }
    }

    if (matches) {
      matchingNodeIds.add(node.id);
    }
  });

  searchResults.value = matchingNodeIds;
  searchActive.value = true;
  applySearchResults();

  showMessage(
    `Found ${matchingNodeIds.size} matching ${
      matchingNodeIds.size === 1 ? "node" : "nodes"
    }`,
    "success"
  );
}

// Apply search results - hide non-matching nodes and edges
function applySearchResults() {
  if (!graph || !searchActive.value) return;

  const nodeUpdates: any[] = [];
  const edgeUpdates: any[] = [];

  // Hide/show nodes based on search results
  graphStore.nodes.forEach((node: any) => {
    const isMatch = searchResults.value.has(node.id);

    nodeUpdates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: isMatch ? "visible" : "hidden",
        stroke: isMatch ? "#3b82f6" : undefined,
        lineWidth: isMatch ? 3 : undefined,
      },
    });
  });

  // Hide edges where either source or target is hidden
  graphStore.edges.forEach((edge: any) => {
    const sourceVisible = searchResults.value.has(edge.source);
    const targetVisible = searchResults.value.has(edge.target);
    const isVisible = sourceVisible && targetVisible;

    edgeUpdates.push({
      id: edge.id || `${edge.source}-${edge.target}`,
      style: {
        ...edge.style,
        visibility: isVisible ? "visible" : "hidden",
      },
    });
  });

  if (nodeUpdates.length > 0) {
    graph.updateNodeData(nodeUpdates);
  }

  if (edgeUpdates.length > 0) {
    graph.updateEdgeData(edgeUpdates);
  }

  graph.render();
}

// Clear search
function clearSearch() {
  searchQuery.value = "";
  searchResults.value.clear();
  searchActive.value = false;

  if (!graph) return;

  // Show all nodes and edges, remove search highlighting
  const nodeUpdates: any[] = [];
  const edgeUpdates: any[] = [];

  graphStore.nodes.forEach((node: any) => {
    nodeUpdates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: "visible",
        stroke: undefined,
        lineWidth: undefined,
      },
    });
  });

  graphStore.edges.forEach((edge: any) => {
    edgeUpdates.push({
      id: edge.id || `${edge.source}-${edge.target}`,
      style: {
        ...edge.style,
        visibility: "visible",
      },
    });
  });

  if (nodeUpdates.length > 0) {
    graph.updateNodeData(nodeUpdates);
  }

  if (edgeUpdates.length > 0) {
    graph.updateEdgeData(edgeUpdates);
  }

  graph.render();
}

// Toggle search mode between AND/OR
function toggleSearchMode() {
  searchMode.value = searchMode.value === "AND" ? "OR" : "AND";
  showMessage(`Search mode: ${searchMode.value}`, "info");
  // Re-apply search if active
  if (searchActive.value) {
    performSearch();
  }
}

// Search Nostr relays for matching events
async function searchNostrRelays() {
  if (!searchQuery.value.trim()) {
    showMessage("Please enter a search query", "warning");
    return;
  }

  isSearching.value = true;
  contextMenu.value.show = false;

  try {
    const query = searchQuery.value.trim();

    // Parse the query using nostr-dsl
    const parsedFilter = parseNostrQuery(query);

    parsedFilter.kinds = undefined
    console.log("[Search] Parsed filter:", parsedFilter);

    // Extract search text for client-side filtering
    const searchText = parsedFilter.search?.toLowerCase() || "";

    // Build Nostr filter for relay query
    // Start with parsed filter but ensure we have default kinds if none specified
    // Keep 'search' field for NIP-50 full-text search support on relays
    const relayFilter: any = { ...parsedFilter };

    // Extract naddr relay hints before sending filter to relay
    const naddrRelays: string[] = relayFilter._relays || [];
    delete relayFilter._relays;


    if (!relayFilter.limit) {
      relayFilter.limit = 100; // Default limit
    }

    console.log("[Search] Relay filter:", relayFilter);
    if (naddrRelays.length > 0) {
      console.log("[Search] Using naddr relay hints:", naddrRelays);
    }

    // Fetch events from relays using the parsed filter
    // If naddr relay hints exist, query those relays directly via pool
    let events;
    if (naddrRelays.length > 0) {
      const pool = getPool();
      const combinedRelays = [...new Set([...nostrRelays.value, ...naddrRelays])];
      console.log("[Search] Querying combined relays:", combinedRelays);
      events = await pool.querySync(combinedRelays, relayFilter);
      // Also store events
      if (events.length > 0) {
        const { storeEvents } = await import('../db');
        await storeEvents(events);
      }
    } else {
      events = await fetchInitialEvents([relayFilter]);
    }

    // Apply client-side text search if search text exists
    let matchingEvents = events;
    if (searchText) {
      matchingEvents = events.filter((event) => {
        // Search content
        if (event.content?.toLowerCase().includes(searchText)) return true;

        // Search tags
        if (
          event.tags?.some((t: string[]) =>
            t.some((val: string) => val?.toLowerCase().includes(searchText))
          )
        )
          return true;

        return false;
      });
    }

    if (matchingEvents.length > 0) {
      graphStore.updateWithEvents(matchingEvents);
      showMessage(`Added ${matchingEvents.length} events from Nostr relays`, "success");

      // Automatically perform local search to highlight new results
      setTimeout(() => performSearch(), 500);
    } else {
      showMessage("No matching events found on Nostr relays", "info");
    }
  } catch (error) {
    console.error("Failed to search Nostr relays:", error);
    showMessage("Failed to search Nostr relays", "error");
  } finally {
    isSearching.value = false;
  }
}

// Start investigation - focus on single event
function startInvestigation(eventId: string) {
  contextMenu.value.show = false;

  if (!graph) return;

  // Find the selected node
  const selectedNode = graphStore.nodes.find((node: any) => node.id === eventId);

  if (!selectedNode) {
    showMessage("Event not found in graph", "error");
    return;
  }

  // Clear the graph and keep only the selected event node (no author node)
  graphStore.setGraphData({
    nodes: [selectedNode],
    edges: [],
  });

  showMessage(
    "Investigation started from this event. Use expansion options to build the graph.",
    "success",
    5000
  );
}

// Remove node from graph
function removeNode(nodeId: string) {
  contextMenu.value.show = false;

  // Check how many nodes would remain
  const remainingCount = graphStore.nodes.length - 1;

  if (remainingCount === 0) {
    showMessage("Cannot remove the last node from graph", "warning");
    return;
  }

  // Remove from graph store (also removes connected edges)
  graphStore.removeNode(nodeId);

  showMessage("Node removed from graph", "success");
}

// Watch for settings changes and auto-apply with debounce
watch(
  layoutSettings,
  () => {
    // Clear existing timer to debounce rapid changes (e.g., dragging sliders)
    if (layoutSettingsDebounceTimer) {
      clearTimeout(layoutSettingsDebounceTimer);
    }

    // Apply settings after 150ms of no changes
    layoutSettingsDebounceTimer = setTimeout(() => {
      applyLayoutSettings();
      layoutSettingsDebounceTimer = null;
    }, 150);
  },
  { deep: true }
);

// Handle Escape key to clear selection
function handleEscapeKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedNodeIds.value.size > 0) {
    clearSelection();
  }
}

onMounted(() => {
  if (!graphRef.value) return;

  // Initialize G6 graph with HTML nodes
  graph = new Graph({
    container: graphRef.value,
    width: graphRef.value.offsetWidth,
    height: graphRef.value.offsetHeight,

    layout: getLayoutConfig(layoutMode.value),

    // Reserve space at the bottom for the timebar
    padding: [10, 10, 120, 10],

    // Speed up animations globally
    animation: {
      duration: 300, // Faster transitions (default is 500ms)
    },

    plugins: [
      // Timebar plugin - always visible
      {
        type: "timebar",
        key: "timebar",
        className: "g6-timebar",
        zIndex: 10,
        data: timebarData.value,
        width: graphRef.value.offsetWidth - 20,
        height: 100,
        position: "bottom",
        timebarType: "chart",
        elementTypes: ["node"],
        mode: "visibility", // hides/shows nodes without removing from data → setData+updatePlugin reliably restores filter state
        values: timebarTimeRange.value || defaultTimeRange.value,
        getTime: (datum: any) => {
          // Author/pubkey nodes are timeless — always keep them visible by
          // returning the midpoint of the current active window so they are
          // never outside the selected range.
          if (datum.data?.type === 'pubkey') {
            const range = timebarTimeRange.value || defaultTimeRange.value;
            return (range[0] + range[1]) / 2;
          }
          // Regular event nodes
          const t = datum.data?.event?.created_at || datum.data?.created_at;
          if (t) return t * 1000;
          return null;
        },
        labelFormatter: (time: number) => {
          const date = new Date(time);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
        onChange: (values: [number, number]) => {
          timebarTimeRange.value = values;
          // onChange fires after the timebar has already applied node visibility,
          // so we can sync edge visibility synchronously here.
          syncEdgeVisibility();
          if (!graph) return;
          graph.layout();
          setTimeout(() => { graph?.fitView(); }, 350);
        },
        onPlay: () => {},
        onPause: () => {
          graph?.layout();
          setTimeout(() => { graph?.fitView(); }, 350);
        },
        onReset: () => {
          graph?.layout();
          setTimeout(() => { graph?.fitView(); }, 350);
        },
      },
      {
        type: "tooltip",
        enable: (event: any) => event.targetType === "edge",
        getContent: (_event: any, items: any[]) => {
          if (!items || items.length === 0) return "";
          const edge = items[0];
          const style = getEdgeStyle(edge);
          const type = edge.data?.type || "unknown";
          const marker = edge.data?.marker || "";

          let description = style.label;
          let details = "";

          // Add contextual information based on edge type
          if (type === "authored-by") {
            details = "Identity relationship - connects content to its creator";
          } else if (type === "reference" && marker === "reply") {
            details = "Conversation thread - this is a direct reply";
          } else if (type === "reference") {
            details = "Content reference - links to related content";
          } else if (type === "mention") {
            details = "User mention - references another user";
          } else if (type === "repost") {
            details = "Amplification - shares content to wider audience";
          } else if (type === "reaction") {
            details = "Engagement - expresses reaction to content";
          } else if (type === "tree-structure") {
            details = "Tree layout structural edge";
          } else {
            details = "Connection between nodes";
          }

          return `
            <div style="padding: 8px 12px; background: rgba(0, 0, 0, 0.85); color: white; border-radius: 6px; font-size: 12px; max-width: 250px;">
              <div style="font-weight: 600; margin-bottom: 4px; color: ${style.stroke};">${description}</div>
              <div style="opacity: 0.9; line-height: 1.4;">${details}</div>
            </div>
          `;
        },
      },
    ],

    behaviors: [
      "drag-canvas",
      "zoom-canvas",
      {
        type: "drag-element",
        enable: (event: any) => {
          // Only allow dragging when shift is NOT held (shift is for selection)
          return !event.shiftKey;
        },
      },
      {
        type: "click-select",
        multiple: true,
        trigger: ["shift"],
        state: "selected",
      },
      {
        type: "brush-select",
        trigger: ["shift"], // Shift+drag to brush-select
        immediately: true, // Select as box encloses elements
        state: "selected",
        mode: "union", // Add to existing selection instead of replacing
        style: {
          fill: "rgba(59, 130, 246, 0.1)",
          stroke: "#3b82f6",
          lineWidth: 2,
          lineDash: [4, 4],
        },
      },
    ],

    node: {
      type: "html",
      style: {
        size: (d: any) => {
          const expanded = d.data?.expanded;
          return expanded ? [400, 300] : [60, 60];
        },
        dx: (d: any) => {
          const expanded = d.data?.expanded;
          const width = expanded ? 400 : 60;
          return -width / 2;
        },
        dy: (d: any) => {
          const expanded = d.data?.expanded;
          const height = expanded ? 300 : 60;
          return -height / 2;
        },
        innerHTML: (d: any) => renderEventNode(d),
      },
      state: {
        selected: {
          halo: true,
          haloStroke: "#10b981",
          haloStrokeWidth: 8,
          haloOpacity: 0.5,
        },
      },
    },

    edge: {
      style: {
        stroke: (d: any) => getEdgeStyle(d).stroke,
        lineWidth: (d: any) => getEdgeStyle(d).lineWidth,
        lineDash: (d: any) => getEdgeStyle(d).lineDash,
        opacity: (d: any) => getEdgeStyle(d).opacity,
        endArrow: true,
        labelText: () => "", // Empty by default, shown on hover
        labelFill: "#666",
        labelFontSize: 10,
        labelBackground: true,
        labelBackgroundFill: "#fff",
        labelBackgroundOpacity: 0.9,
        labelBackgroundRadius: 3,
        labelBackgroundPadding: [2, 4],
      },
      state: {
        hover: {
          stroke: (d: any) => getEdgeStyle(d).stroke,
          lineWidth: (d: any) => getEdgeStyle(d).lineWidth + 1,
          opacity: 1,
          labelText: (d: any) => getEdgeStyle(d).label,
        },
      },
    },
  });

  // Load initial data
  graph.setData(graphData.value);
  graph.render();

  // Animation starts automatically and runs until it stabilizes naturally
  isAnimating.value = true;

  // Single click to mark node as active (for tree root selection)
  graph.on("node:click", (evt: any) => {
    const nodeId = evt.target?.id || evt.item?.id;
    if (!nodeId) return;

    // Handle shift+click for multi-selection (manual implementation since HTML nodes don't work with click-select behavior)
    if (evt.shiftKey) {
      console.log("[Selection] Shift+click on:", nodeId);
      const currentState = graph?.getElementState(nodeId);
      const isSelected = currentState?.includes("selected");

      if (isSelected) {
        // Deselect
        graph?.setElementState(nodeId, "selected", false);
        selectedNodeIds.value.delete(nodeId);
        console.log("[Selection] Deselected:", nodeId, "Total:", selectedNodeIds.value.size);

        // Remove CSS class
        const element = graphRef.value?.querySelector(`[data-item-id="${nodeId}"]`);
        element?.classList.remove("g6-selected");
      } else {
        // Select
        graph?.setElementState(nodeId, "selected", true);
        selectedNodeIds.value.add(nodeId);
        console.log("[Selection] Selected:", nodeId, "Total:", selectedNodeIds.value.size);

        // Add CSS class
        setTimeout(() => {
          const element = graphRef.value?.querySelector(`[data-item-id="${nodeId}"]`);
          if (element && !element.classList.contains("g6-selected")) {
            element.classList.add("g6-selected");
            console.log("[Selection] Applied g6-selected class to:", nodeId);
          }
        }, 10);
      }
      return;
    }

    // Normal click: clear multi-selection and select this node only
    console.log("[Selection] Single click on:", nodeId);

    // Clear all previous selections
    if (selectedNodeIds.value.size > 0) {
      selectedNodeIds.value.forEach((id: string) => {
        graph?.setElementState(id, "selected", false);
      });
      selectedNodeIds.value.clear();

      // Clear CSS classes
      const allElements = graphRef.value?.querySelectorAll("[data-item-id]");
      allElements?.forEach((el) => {
        el.classList.remove("g6-selected");
      });
    }

    // Select the clicked node
    graph?.setElementState(nodeId, "selected", true);
    selectedNodeIds.value.add(nodeId);
    console.log("[Selection] Selected single node:", nodeId);

    // Add CSS class
    setTimeout(() => {
      const element = graphRef.value?.querySelector(`[data-item-id="${nodeId}"]`);
      if (element && !element.classList.contains("g6-selected")) {
        element.classList.add("g6-selected");
      }
    }, 10);

    // Check if node is collapsed and select it for visual feedback
    const nodeData = graph.getNodeData(nodeId);
    if (nodeData && !nodeData.data?.expanded) {
      selectedCollapsedNodeId.value = nodeId;
    } else {
      selectedCollapsedNodeId.value = null; // Deselect if expanded
    }
  });

  // Double-click to expand/collapse node
  graph.on("node:dblclick", (evt: any) => {
    const nodeId = evt.target?.id || evt.item?.id;
    if (!nodeId) return;

    const nodeData = graph.getNodeData(nodeId);
    if (!nodeData) return;

    // For pubkey nodes, only expand if they have profile data
    if (nodeData.data?.type === "pubkey") {
      if (!nodeData.data?.profile) return;
    }

    // For event nodes, only expand if there's event data
    if (nodeData.data?.type !== "pubkey" && !nodeData.data?.event) return;

    const expanded = !nodeData.data?.expanded;
    const updated = {
      ...nodeData,
      data: {
        ...nodeData.data,
        expanded,
      },
      style: {
        ...nodeData.style,
        size: expanded ? [400, 300] : [60, 60],
        dx: expanded ? -200 : -30,
        dy: expanded ? -150 : -30,
      },
    };

    graph.updateNodeData([updated]);
    graph.render();

    // Wait for DOM to update before applying selected class
    nextTick(() => {
      if (expanded) {
        selectedCardId.value = nodeId;
        selectedCollapsedNodeId.value = null; // Clear collapsed selection when expanding
        console.log("[Card] Auto-selected card after expand:", nodeId);
      } else {
        selectedCardId.value = null; // Deselect when collapsing
        selectedCollapsedNodeId.value = nodeId; // Select collapsed node
      }
    });

    // No need to rerun layout - space is always reserved for card size
  });

  // Handle canvas click (deselect)
  graph.on("canvas:click", () => {
    selectedCardId.value = null; // Deselect card when clicking on canvas
    selectedCollapsedNodeId.value = null; // Deselect collapsed node
    clearSelection(); // Clear multi-selection
  });

  // Close button click (DOM event delegation)
  graphRef.value.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement;

    // Check for stat clicks FIRST (left-click = refresh count)
    const stat = target.closest('[data-role^="stat-"]');
    if (stat) {
      e.stopPropagation(); // Prevent card selection
      const role = stat.getAttribute("data-role");
      const eventId = stat.getAttribute("data-event-id");

      if (eventId) {
        // Map stat role to refresh handler
        if (role === "stat-reactions") {
          handleRefreshReactions(eventId);
        } else if (role === "stat-replies") {
          handleRefreshReplies(eventId);
        } else if (role === "stat-reposts") {
          handleRefreshReposts(eventId);
        } else if (role === "stat-mentions") {
          handleRefreshMentions(eventId);
        } else if (role === "stat-thread") {
          handleRefreshThread(eventId);
        }
      }
      return;
    }

    // Check for close button
    const closeBtn = target.closest('[data-role="close"]');
    if (closeBtn) {
      e.stopPropagation(); // Prevent card selection

      const itemEl = closeBtn.closest("[data-item-id]");
      const nodeId = itemEl?.getAttribute("data-item-id");
      if (!nodeId) return;

      const nodeData = graph.getNodeData(nodeId);
      if (!nodeData) return;

      const updated = {
        ...nodeData,
        data: {
          ...nodeData.data,
          expanded: false,
        },
        style: {
          ...nodeData.style,
          size: [60, 60],
          dx: -30,
          dy: -30,
        },
      };

      graph.updateNodeData([updated]);
      graph.render();
      return;
    }

    // Check for tags
    const tagEl = target.closest("[data-tag]");
    if (tagEl) {
      e.stopPropagation(); // Prevent card selection
      return;
    }

    // Check for mentions
    const mentionEl = target.closest("[data-mention]");
    if (mentionEl) {
      e.stopPropagation(); // Prevent card selection
      return;
    }

    // Check for author section
    const authorEl = target.closest("[data-author-pubkey]");
    if (authorEl) {
      e.stopPropagation(); // Prevent card selection
      return;
    }

    // Finally, check for card click to select it (only if no interactive elements were clicked)
    const card = target.closest(".event-node.expanded");
    if (card) {
      const cardId = card.getAttribute("data-item-id");
      if (cardId) {
        selectedCardId.value = cardId;
        console.log("[Card] Selected card:", cardId);
        return;
      }
    }
  });

  // Right-click context menu (DOM event delegation)
  graphRef.value.addEventListener("contextmenu", (e: MouseEvent) => {
    e.preventDefault();

    const target = e.target as HTMLElement;

    // Don't show context menu for virtual root node
    const virtualRoot = target.closest('[data-item-id="__tree_super_root__"]');
    if (virtualRoot) {
      return;
    }

    // Check if we have multiple nodes selected
    if (selectedNodeIds.value.size > 1) {
      // Check if right-clicking on a selected node
      const clickedNode = target.closest('.node-circle[data-item-id], .event-node.expanded[data-item-id]');
      if (clickedNode) {
        const nodeId = clickedNode.getAttribute('data-item-id');
        if (nodeId && selectedNodeIds.value.has(nodeId)) {
          // Show multi-selection context menu
          showMultiSelectionContextMenu(e.clientX, e.clientY);
          return;
        }
      }
    }

    // Check if right-clicking on a stat (reactions, replies, etc.)
    const stat = target.closest('[data-role^="stat-"]');
    if (stat) {
      const role = stat.getAttribute("data-role");
      const eventId = stat.getAttribute("data-event-id");

      if (eventId && role) {
        const statType = role.replace("stat-", "") as StatType;
        showStatContextMenu(e.clientX, e.clientY, eventId, statType);
        return;
      }
    }

    // Check if clicking on a pubkey node (author circle)
    const pubkeyNodeEl = target.closest(".pubkey-node[data-item-id][data-pubkey]");
    if (pubkeyNodeEl) {
      const nodeId = pubkeyNodeEl.getAttribute("data-item-id");
      const pubkey = pubkeyNodeEl.getAttribute("data-pubkey");

      if (nodeId && pubkey) {
        const actions = [
          {
            label: "Expand all posts by author",
            icon: "mdi-post-outline",
            handler: () => expandAuthorPosts(pubkey),
          },
          {
            label: "Expand blog articles (kind 30023)",
            icon: "mdi-book-open",
            handler: () => expandAuthorArticles(pubkey),
          },
          {
            label: "Expand author profile",
            icon: "mdi-account-details",
            handler: () => expandAuthorProfile(pubkey),
          },
          {
            label: "Show followers/following",
            icon: "mdi-account-group",
            handler: () => expandAuthorNetwork(pubkey),
          },
          {
            label: "Filter to show only this author",
            icon: "mdi-filter",
            handler: () => filterByAuthor(pubkey),
          },
          {
            label: "Start investigation from here",
            icon: "mdi-target",
            handler: () => startInvestigation(nodeId),
          },
          {
            label: "Make tree root",
            icon: "mdi-tree",
            handler: () => makeTreeRoot(nodeId),
          },
          {
            label: "Remove this node",
            icon: "mdi-delete",
            handler: () => removeNode(nodeId),
          },
        ];
        showContextMenu(e.clientX, e.clientY, `Author ${pubkey.slice(0, 8)}...`, actions);
        return;
      }
    }

    // Check if clicking on a tag node (tag circle)
    const tagNodeEl = target.closest(".tag-node[data-item-id][data-tag]");
    if (tagNodeEl) {
      const nodeId = tagNodeEl.getAttribute("data-item-id");
      const tag = tagNodeEl.getAttribute("data-tag");

      if (nodeId && tag) {
        const actions = [
          {
            label: "Expand more posts with this tag",
            icon: "mdi-tag-plus",
            handler: () => expandByTag(tag),
          },
          {
            label: "Filter to show only this tag",
            icon: "mdi-filter",
            handler: () => filterByTag(tag),
          },
          {
            label: "Highlight posts with this tag",
            icon: "mdi-marker",
            handler: () => highlightByTag(tag),
          },
          {
            label: "Start investigation from here",
            icon: "mdi-target",
            handler: () => startInvestigation(nodeId),
          },
          {
            label: "Make tree root",
            icon: "mdi-tree",
            handler: () => makeTreeRoot(nodeId),
          },
          {
            label: "Remove this tag node",
            icon: "mdi-delete",
            handler: () => removeNode(nodeId),
          },
        ];
        showContextMenu(e.clientX, e.clientY, `Tag: #${tag}`, actions);
        return;
      }
    }

    // Check if clicking on a collapsed event node (kind-X circle)
    const eventNodeEl = target.closest(".node-circle[data-item-id]:not(.pubkey-node):not(.tag-node)");
    if (eventNodeEl) {
      const nodeId = eventNodeEl.getAttribute("data-item-id");

      if (nodeId) {
        const nodeData = graph?.getNodeData(nodeId);

        // Only show menu if node is collapsed
        if (nodeData && !nodeData.data?.expanded) {
          const event = nodeData.data?.event as any; // Nostr event
          const isExpanded = nodeData.data?.expanded || false;

          const actions = [
            {
              label: isExpanded ? "Collapse card" : "Expand card",
              icon: isExpanded ? "mdi-arrow-collapse" : "mdi-arrow-expand",
              handler: () => {
                // Simulate double-click to toggle expansion
                graph?.emit("node:dblclick", { item: { id: nodeId }, target: { id: nodeId } });
              },
            },
          ];

          if (event) {
            // Get author pubkey
            const authorPubkey = event.pubkey as string;

            actions.push(
              {
                label: "Expand author profile",
                icon: "mdi-account-details",
                handler: () => expandAuthorProfile(authorPubkey),
              },
              {
                label: "Expand all posts by author",
                icon: "mdi-post-outline",
                handler: () => expandAuthorPosts(authorPubkey),
              }
            );

            // Add stat expansion options
            actions.push(
              {
                label: "Expand replies",
                icon: "mdi-comment",
                handler: () => handleExpandStat(nodeId, "replies"),
              },
              {
                label: "Expand reactions",
                icon: "mdi-heart",
                handler: () => handleExpandStat(nodeId, "reactions"),
              },
              {
                label: "Expand reposts",
                icon: "mdi-repeat",
                handler: () => handleExpandStat(nodeId, "reposts"),
              }
            );

            // Copy event ID/link
            actions.push({
              label: "Copy event ID",
              icon: "mdi-content-copy",
              handler: async () => {
                try {
                  await navigator.clipboard.writeText(event.id as string);
                  showMessage("Event ID copied to clipboard", "success");
                } catch (err) {
                  console.error("Failed to copy:", err);
                  showMessage("Failed to copy event ID", "error");
                }
              },
            });
          }

          actions.push(
            {
              label: "Start investigation from here",
              icon: "mdi-target",
              handler: () => startInvestigation(nodeId),
            },
            {
              label: "Make tree root",
              icon: "mdi-tree",
              handler: () => makeTreeRoot(nodeId),
            },
            {
              label: "Remove from graph",
              icon: "mdi-delete",
              handler: () => removeNode(nodeId),
            }
          );

          const kindLabel = event ? `Event (kind ${event.kind})` : "Event";
          showContextMenu(e.clientX, e.clientY, kindLabel, actions);
          return;
        }
      }
    }

    // Check if clicking on a tag
    const tagEl = target.closest("[data-tag]");
    if (tagEl) {
      const tag = tagEl.getAttribute("data-tag");
      if (tag) {
        // Get the node ID from the card
        const cardEl = tagEl.closest("[data-item-id]");
        const nodeId = cardEl?.getAttribute("data-item-id");

        const actions = [
          {
            label: "Expand posts with this tag",
            icon: "mdi-tag-plus",
            handler: () => expandByTag(tag),
          },
          {
            label: "Filter to show only this tag",
            icon: "mdi-filter",
            handler: () => filterByTag(tag),
          },
          {
            label: "Highlight posts with this tag",
            icon: "mdi-marker",
            handler: () => highlightByTag(tag),
          },
        ];

        if (nodeId) {
          actions.push(
            {
              label: "Start investigation from here",
              icon: "mdi-target",
              handler: () => startInvestigation(nodeId),
            },
            {
              label: "Make tree root",
              icon: "mdi-tree",
              handler: () => makeTreeRoot(nodeId),
            },
            {
              label: "Remove this node",
              icon: "mdi-delete",
              handler: () => removeNode(nodeId),
            }
          );
        }

        showContextMenu(e.clientX, e.clientY, `Tag: #${tag}`, actions);
        return;
      }
    }

    // Check if clicking on a mention
    const mentionEl = target.closest("[data-mention]");
    if (mentionEl) {
      const pubkey = mentionEl.getAttribute("data-mention");
      if (pubkey) {
        // Get the node ID from the card
        const cardEl = mentionEl.closest("[data-item-id]");
        const nodeId = cardEl?.getAttribute("data-item-id");

        const actions = [
          {
            label: "Expand user posts",
            icon: "mdi-post",
            handler: () => expandAuthorPosts(pubkey),
          },
          {
            label: "Expand user profile",
            icon: "mdi-account",
            handler: () => expandAuthorProfile(pubkey),
          },
          {
            label: "Filter to show only this user",
            icon: "mdi-filter",
            handler: () => filterByAuthor(pubkey),
          },
          {
            label: "Highlight user content",
            icon: "mdi-marker",
            handler: () => highlightByAuthor(pubkey),
          },
        ];

        if (nodeId) {
          actions.push(
            {
              label: "Start investigation from here",
              icon: "mdi-target",
              handler: () => startInvestigation(nodeId),
            },
            {
              label: "Make tree root",
              icon: "mdi-tree",
              handler: () => makeTreeRoot(nodeId),
            },
            {
              label: "Remove this node",
              icon: "mdi-delete",
              handler: () => removeNode(nodeId),
            }
          );
        }

        showContextMenu(e.clientX, e.clientY, `User ${pubkey.slice(0, 8)}...`, actions);
        return;
      }
    }

    // Check if clicking on author section
    const authorEl = target.closest("[data-author-pubkey]");
    if (authorEl) {
      const pubkey = authorEl.getAttribute("data-author-pubkey");
      if (pubkey) {
        // Get the node ID from the card
        const cardEl = authorEl.closest("[data-item-id]");
        const nodeId = cardEl?.getAttribute("data-item-id");

        const actions = [
          {
            label: "Expand all posts by author",
            icon: "mdi-post-outline",
            handler: () => expandAuthorPosts(pubkey),
          },
          {
            label: "Expand blog articles (kind 30023)",
            icon: "mdi-book-open",
            handler: () => expandAuthorArticles(pubkey),
          },
          {
            label: "Expand author profile",
            icon: "mdi-account-details",
            handler: () => expandAuthorProfile(pubkey),
          },
          {
            label: "Show followers/following",
            icon: "mdi-account-group",
            handler: () => expandAuthorNetwork(pubkey),
          },
          {
            label: "Filter to show only this author",
            icon: "mdi-filter",
            handler: () => filterByAuthor(pubkey),
          },
        ];

        if (nodeId) {
          actions.push(
            {
              label: "Start investigation from here",
              icon: "mdi-target",
              handler: () => startInvestigation(nodeId),
            },
            {
              label: "Make tree root",
              icon: "mdi-tree",
              handler: () => makeTreeRoot(nodeId),
            },
            {
              label: "Remove this node",
              icon: "mdi-delete",
              handler: () => removeNode(nodeId),
            }
          );
        }

        showContextMenu(e.clientX, e.clientY, `Author ${pubkey.slice(0, 8)}...`, actions);
        return;
      }
    }

    // Check if clicking on an expanded profile card
    const profileCardEl = target.closest(".profile-card[data-item-id][data-pubkey]");
    if (profileCardEl) {
      const nodeId = profileCardEl.getAttribute("data-item-id");
      const pubkey = profileCardEl.getAttribute("data-pubkey");

      if (nodeId && pubkey) {
        const actions = [
          {
            label: "Expand all posts by author",
            icon: "mdi-post-outline",
            handler: () => expandAuthorPosts(pubkey),
          },
          {
            label: "Expand blog articles (kind 30023)",
            icon: "mdi-book-open",
            handler: () => expandAuthorArticles(pubkey),
          },
          {
            label: "Show followers/following",
            icon: "mdi-account-group",
            handler: () => expandAuthorNetwork(pubkey),
          },
          {
            label: "Filter to show only this author",
            icon: "mdi-filter",
            handler: () => filterByAuthor(pubkey),
          },
          {
            label: "Copy pubkey",
            icon: "mdi-content-copy",
            handler: async () => {
              try {
                await navigator.clipboard.writeText(pubkey);
                showMessage("Pubkey copied to clipboard", "success");
              } catch (err) {
                console.error("Failed to copy:", err);
                showMessage("Failed to copy pubkey", "error");
              }
            },
          },
          {
            label: "Start investigation from here",
            icon: "mdi-target",
            handler: () => startInvestigation(nodeId),
          },
          {
            label: "Make tree root",
            icon: "mdi-tree",
            handler: () => makeTreeRoot(nodeId),
          },
          {
            label: "Remove this profile",
            icon: "mdi-delete",
            handler: () => removeNode(nodeId),
          },
        ];

        showContextMenu(e.clientX, e.clientY, `Profile: ${pubkey.slice(0, 8)}...`, actions);
        return;
      }
    }

    // Check if clicking on a card (general note context menu)
    const cardEl = target.closest("[data-item-id][data-kind][data-author]");
    if (cardEl) {
      const kind = cardEl.getAttribute("data-kind");
      const author = cardEl.getAttribute("data-author");
      const itemId = cardEl.getAttribute("data-item-id");

      if (kind && author && itemId) {
        const kindNum = parseInt(kind);
        let title = "Note Options";
        const actions: Array<{ label: string; icon: string; handler: () => void }> = [];

        // Add kind-specific options
        if (kindNum === 6) {
          // Repost
          actions.push({
            label: "Show original post",
            icon: "mdi-bookmark",
            handler: () => expandOriginalPost(itemId),
          });
        }

        if (kindNum === 1 || kindNum === 30023) {
          // Note or Article
          actions.push({
            label: "Show thread/replies",
            icon: "mdi-comment-multiple",
            handler: () => expandThread(itemId),
          });
          actions.push({
            label: "Show reactions",
            icon: "mdi-heart",
            handler: () => expandReactions(itemId),
          });
          actions.push({
            label: "Show reposts",
            icon: "mdi-repeat",
            handler: () => expandReposts(itemId),
          });
        }

        // Always add author expand option
        actions.push({
          label: "Start investigation from here",
          icon: "mdi-target",
          handler: () => startInvestigation(itemId),
        });
        actions.push({
          label: "Expand author profile",
          icon: "mdi-account",
          handler: () => expandAuthorProfile(author),
        });
        actions.push({
          label: "Filter to show related",
          icon: "mdi-filter",
          handler: () => filterRelated(itemId),
        });
        actions.push({
          label: "Make tree root",
          icon: "mdi-tree",
          handler: () => makeTreeRoot(itemId),
        });
        actions.push({
          label: "Remove this node",
          icon: "mdi-delete",
          handler: () => removeNode(itemId),
        });

        showContextMenu(e.clientX, e.clientY, title, actions);
        return;
      }
    }
  });

  // Handle mouse wheel for scrolling cards
  graphRef.value.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      // Find which card (if any) the mouse is currently over
      const target = e.target as HTMLElement;
      const expandedCard = target.closest(".event-node.expanded");

      if (!expandedCard) {
        // Mouse is not over an expanded card, allow normal zoom behavior
        return;
      }

      // Find the card body (scrollable content area)
      const cardBody = expandedCard.querySelector(".event-body");
      if (!cardBody) return;

      // Check if we're actually over the content area (not just the card container)
      const bodyRect = cardBody.getBoundingClientRect();
      const isOverBody =
        e.clientX >= bodyRect.left &&
        e.clientX <= bodyRect.right &&
        e.clientY >= bodyRect.top &&
        e.clientY <= bodyRect.bottom;

      if (isOverBody) {
        // Prevent canvas zoom and scroll the card instead
        e.preventDefault();
        e.stopPropagation();
        cardBody.scrollTop += e.deltaY;
      }
      // If mouse is over card but not over scrollable body (e.g., header/footer),
      // allow normal zoom behavior by not preventing default
    },
    { passive: false }
  );

  // Deselect card when clicking outside
  graphRef.value.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement;
    const card = target.closest(".event-node.expanded");

    if (!card) {
      selectedCardId.value = null;
    }
  });

  // Handle window resize
  window.addEventListener("resize", handleResize);

  // Listen to G6 selection events to sync with our state
  graph.on("afteritemselected", (_evt: any) => {
    // Sync selectedNodeIds for batch operations menu
    if (!graph) return;

    const allNodes = graphData.value.nodes;
    if (!allNodes) return;

    const selected = new Set<string>();

    allNodes.forEach((node: any) => {
      const state = graph?.getElementState(node.id);
      if (state && state.includes('selected')) {
        selected.add(node.id);
      }
    });

    selectedNodeIds.value = selected;
    console.log("[Selection] Nodes selected:", selected.size);

    // Apply CSS class for visual feedback on HTML nodes (halo doesn't work with HTML)
    setTimeout(() => {
      selected.forEach((nodeId: string) => {
        const element = graphRef.value?.querySelector(`[data-item-id="${nodeId}"]`);
        if (element && !element.classList.contains("g6-selected")) {
          element.classList.add("g6-selected");
        }
      });
    }, 10);
  });

  graph.on("afteritemsunselected", (_evt: any) => {
    // Sync selectedNodeIds for batch operations menu
    if (!graph) return;

    const allNodes = graphData.value.nodes;
    if (!allNodes) return;

    const selected = new Set<string>();

    allNodes.forEach((node: any) => {
      const state = graph?.getElementState(node.id);
      if (state && state.includes('selected')) {
        selected.add(node.id);
      }
    });

    selectedNodeIds.value = selected;
    console.log("[Selection] Nodes after unselect:", selected.size);

    // Remove CSS class from all nodes first
    const allElements = graphRef.value?.querySelectorAll("[data-item-id]");
    allElements?.forEach((el) => {
      el.classList.remove("g6-selected");
    });

    // Re-apply to still-selected nodes
    setTimeout(() => {
      selected.forEach((nodeId: string) => {
        const element = graphRef.value?.querySelector(`[data-item-id="${nodeId}"]`);
        if (element) {
          element.classList.add("g6-selected");
        }
      });
    }, 10);
  });

  // Set up Escape key handler to clear selection
  window.addEventListener("keydown", handleEscapeKey);

  // Restore last active investigation if available
  (async () => {
    const lastStateId = getLastActiveState();
    if (lastStateId) {
      try {
        const state = await loadGraphState(lastStateId);
        if (state) {
          console.log("[Investigation] Restoring last active state:", state.name);
          await restoreInvestigation(lastStateId);
          return; // Don't load from DB, we're restoring saved state
        }
      } catch (error) {
        console.warn("[Investigation] Failed to restore last state:", error);
      }
    }

    // If no saved state or restoring failed, try loading from database
    loadFromDb();
  })();
});

onUnmounted(() => {
  if (graph) {
    graph.destroy();
  }
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleEscapeKey);
});

// Cascades node visibility to their edges.
// G6's timebar mode:"visibility" only hides nodes; edges must be synced manually.
function syncEdgeVisibility() {
  if (!graph) return;
  const range = timebarTimeRange.value;
  const allData = graph.getData();
  const nodes: any[] = (allData.nodes ?? []) as any[];
  const edges: any[] = (allData.edges ?? []) as any[];

  // Mirror the timebar's own getTime logic to know which nodes are visible
  const visibleNodeIds = new Set<string>();
  if (!range) {
    nodes.forEach((n: any) => visibleNodeIds.add(n.id));
  } else {
    const [start, end] = range;
    nodes.forEach((node: any) => {
      if (node.data?.type === 'pubkey') { visibleNodeIds.add(node.id); return; }
      const t = node.data?.event?.created_at || node.data?.created_at;
      const ms = t ? t * 1000 : null;
      if (ms !== null && ms >= start && ms <= end) visibleNodeIds.add(node.id);
    });
  }

  const toShow: string[] = [];
  const toHide: string[] = [];
  edges.forEach((edge: any) => {
    if (!edge.id) return;
    if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) toShow.push(edge.id);
    else toHide.push(edge.id);
  });

  if (toShow.length > 0) graph.showElement(toShow);
  if (toHide.length > 0) graph.hideElement(toHide);
}

// Helper: re-apply the active time filter after setData() replaces graph data.
// With mode:"visibility" updatePlugin correctly re-hides out-of-range nodes after
// any setData() call because nodes stay in the data graph (just hidden/shown)
// and the timebar re-evaluates all of them when values are set.
function refreshTimebar() {
  if (!graph) return;
  graph.updatePlugin({
    key: 'timebar',
    data: timebarData.value,
    values: timebarTimeRange.value || defaultTimeRange.value,
  } as any);
  // updatePlugin triggers async re-evaluation; sync edges after the tick
  setTimeout(() => syncEdgeVisibility(), 0);
}

// Watch for timebarData changes and update the timebar plugin dynamically
watch(timebarData, (newData) => {
  if (!graph) return;

  console.log('[Timebar] Updating data with', newData.length, 'points');
  graph.updatePlugin({
    key: 'timebar',
    data: newData,
  } as any);
}, { deep: true });

// Watch for layout changes
watch(layoutMode, (newLayout, oldLayout) => {
  if (!graph || !graphData.value) return;

  const newIsTree = isTreeLayout(newLayout);
  const oldIsTree = oldLayout ? isTreeLayout(oldLayout) : false;

  console.log(
    "[Layout Switch]",
    oldLayout,
    "->",
    newLayout,
    "newIsTree:",
    newIsTree,
    "oldIsTree:",
    oldIsTree
  );

  // Preserve original graph data if not already saved
  // Use currently rendered graph data, not all data from store
  if (!originalGraphData.value) {
    const currentData = graph.getData();
    console.log(
      "[Layout] Saving current graph data:",
      currentData.nodes?.length,
      "nodes,",
      currentData.edges?.length,
      "edges"
    );
    if (currentData.nodes && currentData.edges) {
      originalGraphData.value = {
        nodes: JSON.parse(JSON.stringify(currentData.nodes)),
        edges: JSON.parse(JSON.stringify(currentData.edges)),
      };
    }
  }

  // Switching to tree layout
  if (newIsTree && !oldIsTree) {
    console.log("[Layout] Switching to tree layout, converting data");

    // Use current data from graphStore to ensure we have all nodes
    const nodes = graphStore.nodes;
    const edges = graphStore.edges;

    // Save a snapshot for potential restoration (though we now use graphStore directly)
    if (!originalGraphData.value) {
      originalGraphData.value = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      };
    }

    console.log(
      "[Layout] Converting",
      nodes.length,
      "nodes and",
      edges.length,
      "edges to tree"
    );

    // Find root node (or ask user if no active node)
    let rootId = findBestRoot(nodes, edges);

    if (!rootId && nodes.length > 0) {
      // TODO: Show dialog to let user select root
      console.warn("[Layout] No root found, using first node");
      rootId = nodes[0].id;
    }

    if (rootId) {
      treeRootId.value = rootId;
      const treeData = prepareTreeData(nodes, edges, rootId);
      console.log("[Layout] Tree data:", treeData);

      graph.setData(treeData);
      graph.setLayout(getLayoutConfig(newLayout));
      graph.layout();
      graph.render();
      refreshTimebar();

      // Fit view after tree layout
      setTimeout(() => {
        graph.fitView();
      }, 500);
    }
  }
  // Switching from tree to graph layout
  else if (!newIsTree && oldIsTree) {
    console.log("[Layout] Switching to graph layout, restoring all data");

    // Use current data from graphStore (which includes all nodes added during tree layout)
    // Don't use originalGraphData as it's a stale snapshot from before tree layout
    const currentGraphData = {
      nodes: graphStore.nodes,
      edges: graphStore.edges,
    };

    console.log("[Layout] Restoring", currentGraphData.nodes.length, "nodes and", currentGraphData.edges.length, "edges");

    graph.setData(currentGraphData);
    graph.setLayout(getLayoutConfig(newLayout));
    graph.layout();
    graph.render();
    refreshTimebar();

    // Clear the cached originalGraphData since we're back to normal graph mode
    originalGraphData.value = null;
  }
  // Staying within same data type (graph to graph, or tree to tree)
  else {
    if (newIsTree && treeRootId.value) {
      // Tree to tree - rebuild tree with same root using current graph data
      console.log(
        "[Layout] Tree to tree switch, rebuilding with root:",
        treeRootId.value
      );

      // Use current data from graphStore to include any nodes added during tree layout
      const nodes = graphStore.nodes;
      const edges = graphStore.edges;

      console.log("[Layout] Using current graph data:", nodes.length, "nodes,", edges.length, "edges");

      const treeData = prepareTreeData(nodes, edges, treeRootId.value);

      graph.setData(treeData);
    }

    graph.setLayout(getLayoutConfig(newLayout));
    graph.layout();
    refreshTimebar();
  }

  // Start animation on layout change
  isAnimating.value = true;
});

// Watch for data changes
watch(
  graphData,
  (newData) => {
    console.log("[Watch] Graph data changed, nodes:", newData.nodes?.length, "edges:", newData.edges?.length);
    if (graph) {
      graph.setData(newData);
      graph.render();
      refreshTimebar();
      // Don't auto-start animation on data updates
      // User can manually start if needed

      // Reset original graph data when graph data changes (e.g., after "investigate from here")
      // This ensures tree layouts use the current graph, not old cached data
      if (!isTreeLayout(layoutMode.value)) {
        console.log("[Data] Graph data changed, resetting originalGraphData cache");
        originalGraphData.value = null;
      }

      // Check for pending restore (e.g., after loading investigation)
      const pendingRestore = (window as any).__pendingRestore;
      if (pendingRestore) {
        console.log("[Restore] Applying pending expanded cards:", pendingRestore.expandedCardIds);

        // Clear pending restore flag immediately to prevent duplicate processing
        delete (window as any).__pendingRestore;

        // Wait for graph to fully render before restoring expanded cards
        setTimeout(() => {
          if (!graph) return;

          // Restore expanded cards
          if (pendingRestore.expandedCardIds && pendingRestore.expandedCardIds.length > 0) {
            const nodeUpdates: any[] = [];

            pendingRestore.expandedCardIds.forEach((nodeId: string) => {
              const nodeData = graph.getNodeData(nodeId);
              if (nodeData) {
                console.log("[Restore] Expanding node:", nodeId);
                nodeUpdates.push({
                  ...nodeData,
                  data: {
                    ...nodeData.data,
                    expanded: true,
                  },
                  style: {
                    ...nodeData.style,
                    size: [400, 300],
                    dx: -200,
                    dy: -150,
                  },
                });
              } else {
                console.warn("[Restore] Node not found:", nodeId);
              }
            });

            if (nodeUpdates.length > 0) {
              graph.updateNodeData(nodeUpdates);
              graph.render();
              console.log("[Restore] Restored", nodeUpdates.length, "expanded cards");
            }
          }

          // Restore zoom
          if (pendingRestore.zoom) {
            try {
              graph.zoomTo(pendingRestore.zoom, { x: 0, y: 0 });
            } catch (e) {
              console.warn("[Restore] Could not restore zoom:", e);
            }
          }
        }, 100);
      }
    }
  },
  { deep: true }
);

// Watch for relay dialog open to refresh data
watch(
  () => relayDialog.value.show,
  async (isOpen) => {
    if (isOpen) {
      await relayManager.loadRelays();
      relayManager.updateStats();
    }
  }
);

// Watch for selected card changes to update CSS classes
watch(selectedCardId, (newCardId, oldCardId) => {
  if (!graphRef.value) return;

  // Remove selected class from previous card immediately
  if (oldCardId) {
    const oldCard = graphRef.value.querySelector(`[data-item-id="${oldCardId}"]`);
    if (oldCard) {
      oldCard.classList.remove("selected");
    }
  }

  // Add selected class to new card
  if (newCardId) {
    const tryAddClass = () => {
      const newCard = graphRef.value?.querySelector(`[data-item-id="${newCardId}"]`);
      if (newCard) {
        newCard.classList.add("selected");
        console.log("[Card] Applied selected class to:", newCardId);
        return true;
      }
      return false;
    };

    // Try immediately first (for already expanded cards)
    if (!tryAddClass()) {
      // If not found, wait for G6 to render (for newly expanded cards)
      setTimeout(() => {
        if (!tryAddClass()) {
          console.warn("[Card] Could not find card element after delay:", newCardId);
        }
      }, 50);
    }
  }
});

// Watch for selected collapsed node changes to update CSS classes
watch(selectedCollapsedNodeId, (newNodeId, oldNodeId) => {
  if (!graphRef.value) return;

  // Remove selected class from previous node
  if (oldNodeId) {
    const oldNode = graphRef.value.querySelector(`.node-circle[data-item-id="${oldNodeId}"]`);
    if (oldNode) {
      oldNode.classList.remove("selected-collapsed");
      console.log("[Node] Removed selected-collapsed class from:", oldNodeId);
    }
  }

  // Add selected class to new node
  if (newNodeId) {
    const newNode = graphRef.value.querySelector(`.node-circle[data-item-id="${newNodeId}"]`);
    if (newNode) {
      newNode.classList.add("selected-collapsed");
      console.log("[Node] Applied selected-collapsed class to:", newNodeId, "- type:", newNode.className);
    } else {
      console.warn("[Node] Could not find node to select:", newNodeId);
    }
  }
});

// Clear multi-selection using G6 API
function clearSelection() {
  if (!graph) return;

  // Clear state for all selected nodes
  selectedNodeIds.value.forEach((nodeId: string) => {
    const state = graph?.getElementState(nodeId);
    if (state && state.includes('selected')) {
      graph?.setElementState(nodeId, 'selected', false);
    }
  });

  selectedNodeIds.value.clear();

  // Remove CSS classes
  const allElements = graphRef.value?.querySelectorAll("[data-item-id]");
  allElements?.forEach((el) => {
    el.classList.remove("g6-selected");
  });

  console.log("[Selection] Cleared");
}

// Batch operations for multi-selection
async function expandAllSelected() {
  if (!graph || selectedNodeIds.value.size === 0) return;

  console.log("[Batch] Expanding", selectedNodeIds.value.size, "nodes");

  const updates: any[] = [];
  selectedNodeIds.value.forEach((nodeId: string) => {
    const nodeData = graph?.getNodeData(nodeId);
    if (nodeData && !nodeData.data?.expanded) {
      // Only expand if has profile or event data
      if (nodeData.data?.type === "pubkey" && !nodeData.data?.profile) return;
      if (nodeData.data?.type !== "pubkey" && !nodeData.data?.event) return;

      updates.push({
        ...nodeData,
        data: {
          ...nodeData.data,
          expanded: true,
        },
        style: {
          ...nodeData.style,
          size: [400, 300],
          dx: -200,
          dy: -150,
        },
      });
    }
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
    showMessage(`Expanded ${updates.length} nodes`, "success");
  }
}

async function collapseAllSelected() {
  if (!graph || selectedNodeIds.value.size === 0) return;

  console.log("[Batch] Collapsing", selectedNodeIds.value.size, "nodes");

  const updates: any[] = [];
  selectedNodeIds.value.forEach((nodeId: string) => {
    const nodeData = graph?.getNodeData(nodeId);
    if (nodeData && nodeData.data?.expanded) {
      updates.push({
        ...nodeData,
        data: {
          ...nodeData.data,
          expanded: false,
        },
        style: {
          ...nodeData.style,
          size: [60, 60],
          dx: -30,
          dy: -30,
        },
      });
    }
  });

  if (updates.length > 0) {
    graph.updateNodeData(updates);
    graph.render();
    showMessage(`Collapsed ${updates.length} nodes`, "success");
  }
}

async function expandPostsBySelectedAuthors() {
  if (!graph || selectedNodeIds.value.size === 0) return;

  const pubkeys: string[] = [];
  selectedNodeIds.value.forEach((nodeId: string) => {
    const nodeData = graph?.getNodeData(nodeId);
    if (nodeData?.data?.type === "pubkey" && typeof nodeData.data.pubkey === 'string') {
      pubkeys.push(nodeData.data.pubkey);
    }
  });

  if (pubkeys.length === 0) {
    showMessage("No author nodes selected", "warning");
    return;
  }

  console.log("[Batch] Expanding posts for", pubkeys.length, "authors");
  showMessage(`Expanding posts for ${pubkeys.length} authors...`, "info");

  for (const pubkey of pubkeys) {
    await expandAuthorPosts(pubkey);
  }
}

async function expandArticlesBySelectedAuthors() {
  if (!graph || selectedNodeIds.value.size === 0) return;

  const pubkeys: string[] = [];
  selectedNodeIds.value.forEach((nodeId: string) => {
    const nodeData = graph?.getNodeData(nodeId);
    if (nodeData?.data?.type === "pubkey" && typeof nodeData.data.pubkey === 'string') {
      pubkeys.push(nodeData.data.pubkey);
    }
  });

  if (pubkeys.length === 0) {
    showMessage("No author nodes selected", "warning");
    return;
  }

  console.log("[Batch] Expanding articles for", pubkeys.length, "authors");
  showMessage(`Expanding articles for ${pubkeys.length} authors...`, "info");

  for (const pubkey of pubkeys) {
    await expandAuthorArticles(pubkey);
  }
}

async function expandNetworkForSelectedAuthors() {
  if (!graph || selectedNodeIds.value.size === 0) return;

  const pubkeys: string[] = [];
  selectedNodeIds.value.forEach((nodeId: string) => {
    const nodeData = graph?.getNodeData(nodeId);
    if (nodeData?.data?.type === "pubkey" && typeof nodeData.data.pubkey === 'string') {
      pubkeys.push(nodeData.data.pubkey);
    }
  });

  if (pubkeys.length === 0) {
    showMessage("No author nodes selected", "warning");
    return;
  }

  console.log("[Batch] Expanding network for", pubkeys.length, "authors");
  showMessage(`Expanding network for ${pubkeys.length} authors...`, "info");

  for (const pubkey of pubkeys) {
    await expandAuthorNetwork(pubkey);
  }
}

async function removeAllSelected() {
  if (!graph || selectedNodeIds.value.size === 0) return;

  const count = selectedNodeIds.value.size;
  console.log("[Batch] Removing", count, "nodes");

  // Convert to array to avoid modification during iteration
  const nodesToRemove = Array.from(selectedNodeIds.value);
  for (const nodeId of nodesToRemove) {
    removeNode(nodeId);
  }

  clearSelection();
  showMessage(`Removed ${count} nodes`, "success");
}

async function copySelectedIds() {
  if (!graph || selectedNodeIds.value.size === 0) return;

  const ids: string[] = [];
  selectedNodeIds.value.forEach((nodeId: string) => {
    const nodeData = graph?.getNodeData(nodeId);
    if (nodeData) {
      if (nodeData.data?.type === "pubkey" && typeof nodeData.data.pubkey === 'string') {
        ids.push(nodeData.data.pubkey);
      } else if (nodeData.data?.event && typeof (nodeData.data.event as any).id === 'string') {
        ids.push((nodeData.data.event as any).id);
      } else {
        ids.push(nodeId);
      }
    }
  });

  const text = ids.join('\n');
  await navigator.clipboard.writeText(text);
  showMessage(`Copied ${ids.length} IDs to clipboard`, "success");
}

function handleResize() {
  if (graph && graphRef.value) {
    graph.setSize(graphRef.value.offsetWidth, graphRef.value.offsetHeight);
  }
}

function fitView() {
  if (graph) {
    graph.fitView();
  }
}

function toggleAnimation() {
  if (!graph) return;

  if (isAnimating.value) {
    graph.stopLayout();
    isAnimating.value = false;
    showMessage("Animation stopped", "info");
  } else {
    graph.layout();
    isAnimating.value = true;
    showMessage("Animation resumed", "info");
  }
}

function refreshGraph() {
  if (graph) {
    graph.layout();
    // Start animation on explicit refresh
    isAnimating.value = true;
  }
}

// Fetch global feed from Nostr relays
async function fetchGlobal() {
  try {
    showMessage("Connecting to Nostr relays...", "info", 5000);
    const events = await fetchGlobalFeed(20);

    if (events.length === 0) {
      showMessage("No events found. Relays may be slow or empty.", "warning", 5000);
      return;
    }

    // After fetching, reload from database to show new events
    await loadFromDb();
    fitView();

    showMessage(`Fetched ${events.length} events successfully!`, "success");
  } catch (error) {
    console.error("Failed to fetch global feed:", error);
    showMessage("Failed to fetch events. Check console for details.", "error", 5000);
  }
}

// Load graph from IndexedDB
async function loadFromDb() {
  try {
    await graphStore.loadFromDatabase();
    const count = graphStore.nodeCount;

    if (count === 0) {
      showMessage("Database is empty. Try fetching events first.", "info", 4000);
    } else {
      showMessage(`Loaded ${count} events from database`, "success");
    }

    fitView();
  } catch (error) {
    console.error("Failed to load from database:", error);
    showMessage("Failed to load from database", "error");
  }
}

// Clear all graph data
function clearAll() {
  graphStore.clearGraph();
  showMessage("Graph cleared", "info");
}

// Relay Manager Functions
// ========================

// Handle adding a new relay
async function handleAddRelay() {
  if (!newRelayUrl.value.trim()) return;

  const url = newRelayUrl.value.trim();
  console.log(`[GraphView] Adding relay: ${url}`);

  const success = await relayManager.addRelay(url);
  if (success) {
    console.log(`[GraphView] Relay added to database, reloading relay list...`);
    newRelayUrl.value = "";

    // Reload relay list in useNostr so it includes the new relay
    await loadRelaysFromDB();

    // Reload relay manager view
    await relayManager.loadRelays();
    relayManager.updateStats();

    // Test the connection for the new relay
    console.log(`[GraphView] Testing connections for updated relay list...`);
    await testAllRelayConnections();

    // Reload relay manager view again to show test results
    await relayManager.loadRelays();
    relayManager.updateStats();

    showMessage("Relay added successfully", "success");
  } else {
    console.error(`[GraphView] Failed to add relay: ${url}`);
  }
}

// Test all relay connections
async function handleTestConnections() {
  testingConnections.value = true;
  try {
    // Reload relay list first to ensure we have latest from database
    await loadRelaysFromDB();
    await testAllRelayConnections();
    await relayManager.loadRelays();
    relayManager.updateStats();
    showMessage("Relay connections tested", "success");
  } catch (error) {
    console.error("Failed to test relay connections:", error);
    showMessage("Failed to test connections", "error");
  } finally {
    testingConnections.value = false;
  }
}

// Handle toggling relay enabled/disabled
async function handleToggleRelay(url: string) {
  try {
    console.log(`[GraphView] Toggling relay: ${url}`);
    await relayManager.toggleRelay(url);

    // Reload relay list in useNostr to reflect the change
    await loadRelaysFromDB();

    // Reload relay manager view
    await relayManager.loadRelays();
    relayManager.updateStats();

    // Test connections for updated relay list
    console.log(`[GraphView] Testing connections after toggle...`);
    await testAllRelayConnections();

    // Reload relay manager view again to show test results
    await relayManager.loadRelays();
    relayManager.updateStats();
  } catch (error) {
    console.error("Failed to toggle relay:", error);
    showMessage("Failed to toggle relay", "error");
  }
}

// Handle removing a relay
async function handleRemoveRelay(url: string) {
  try {
    console.log(`[GraphView] Removing relay: ${url}`);
    await relayManager.removeRelay(url);

    console.log(`[GraphView] Relay removed, reloading relay list...`);
    // Reload relay list in useNostr to remove the relay
    await loadRelaysFromDB();

    // Reload relay manager view
    await relayManager.loadRelays();
    relayManager.updateStats();

    showMessage("Relay removed", "info");
  } catch (error) {
    console.error("Failed to remove relay:", error);
    showMessage("Failed to remove relay", "error");
  }
}

// Get relay status color
function getRelayStatusColor(status: string): string {
  switch (status) {
    case "connected":
      return "success";
    case "connecting":
      return "info";
    case "error":
      return "error";
    case "disconnected":
    default:
      return "grey";
  }
}

// Get relay status icon
function getRelayStatusIcon(status: string): string {
  switch (status) {
    case "connected":
      return "mdi-check-circle";
    case "connecting":
      return "mdi-loading mdi-spin";
    case "error":
      return "mdi-alert-circle";
    case "disconnected":
    default:
      return "mdi-circle-outline";
  }
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Show notification message
function showMessage(message: string, color: string = "success", timeout: number = 3000) {
  snackbar.value = {
    show: true,
    message,
    color,
    timeout,
  };
}

// Handle expand request (from external UI if needed)
async function handleExpand(eventId: string) {
  try {
    showMessage("Loading connected events...", "info", 5000);
    await graphStore.expandNode(eventId);
    fitView();
    showMessage("Graph expanded successfully", "success");
  } catch (error) {
    console.error("Failed to expand node:", error);
    showMessage("Failed to expand node", "error");
  }
}

// ===== Investigation State Management =====

/**
 * Capture current graph state
 */
function captureCurrentState(): Omit<GraphState, "id" | "createdAt" | "updatedAt"> {
  // Get expanded card IDs from the actual graph (not from store)
  const expandedCardIds: string[] = [];
  if (graph) {
    // Iterate through all nodes and check their current state in the graph
    graphStore.nodes.forEach((node: any) => {
      const nodeData = graph.getNodeData(node.id);
      if (nodeData?.data?.expanded) {
        expandedCardIds.push(node.id);
        console.log("[Save] Found expanded card:", node.id);
      }
    });
  }
  console.log("[Save] Total expanded cards:", expandedCardIds.length);

  // Get camera position if available
  let zoom = null;
  let pan = null;
  if (graph) {
    try {
      zoom = graph.getZoom();
      // TODO: G6 v5 camera API might differ, skip pan for now
      // const camera = graph.getCanvas().getCamera();
      // pan = { x: camera.x || 0, y: camera.y || 0 };
    } catch (e) {
      console.warn("Could not capture camera state:", e);
    }
  }

  return {
    name: currentInvestigationName.value,
    description: "",
    graphData: {
      nodes: JSON.parse(JSON.stringify(graphStore.nodes)),
      edges: JSON.parse(JSON.stringify(graphStore.edges)),
    },
    layoutType: layoutMode.value,
    selectedNodeId: graphStore.selectedNodeId,
    treeRootId: treeRootId.value,
    expandedCardIds,
    selectedCardId: selectedCardId.value,
    zoom,
    pan,
    filters: {},
  };
}

/**
 * Save current investigation
 */
async function saveCurrentInvestigation() {
  try {
    const state = captureCurrentState();

    if (currentInvestigationId.value) {
      // Update existing
      await updateGraphState(currentInvestigationId.value, state);
      showMessage(`Saved "${currentInvestigationName.value}"`, "success");
    } else {
      // Create new
      const saved = await saveGraphState(state);
      currentInvestigationId.value = saved.id;
      setLastActiveState(saved.id);
      showMessage(`Created "${currentInvestigationName.value}"`, "success");
    }
  } catch (error) {
    console.error("Failed to save investigation:", error);
    showMessage("Failed to save investigation", "error");
  }
}

/**
 * Restore investigation from saved state
 */
async function restoreInvestigation(stateId: string) {
  try {
    const state = await loadGraphState(stateId);
    if (!state) {
      showMessage("Investigation not found", "error");
      return;
    }

    // Set pending restore BEFORE changing graph data (so watch can pick it up)
    (window as any).__pendingRestore = {
      expandedCardIds: state.expandedCardIds,
      zoom: state.zoom,
      pan: state.pan,
    };
    console.log("[Restore] Set pending restore with expanded cards:", state.expandedCardIds);

    // Restore graph data (this will trigger the watch)
    graphStore.setGraphData({
      nodes: state.graphData.nodes,
      edges: state.graphData.edges,
    });

    // Restore UI state
    layoutMode.value = state.layoutType;
    graphStore.selectedNodeId = state.selectedNodeId;
    treeRootId.value = state.treeRootId;
    selectedCardId.value = state.selectedCardId;

    // Set current investigation
    currentInvestigationId.value = state.id;
    currentInvestigationName.value = state.name;
    setLastActiveState(state.id);

    showMessage(`Loaded "${state.name}"`, "success");
    savedStatesDialog.value = false;
  } catch (error) {
    console.error("Failed to restore investigation:", error);
    showMessage("Failed to restore investigation", "error");
  }
}

/**
 * Load all saved states for dialog
 */
async function loadSavedStates() {
  loadingStates.value = true;
  try {
    savedStates.value = await getAllGraphStates();
  } catch (error) {
    console.error("Failed to load saved states:", error);
    showMessage("Failed to load saved states", "error");
  } finally {
    loadingStates.value = false;
  }
}

/**
 * Delete a saved investigation
 */
async function deleteInvestigation(stateId: string) {
  try {
    await deleteGraphState(stateId);

    // If we deleted the current investigation, reset
    if (currentInvestigationId.value === stateId) {
      currentInvestigationId.value = null;
      currentInvestigationName.value = "Untitled Investigation";
      setLastActiveState(null);
    }

    await loadSavedStates();
    showMessage("Investigation deleted", "success");
  } catch (error) {
    console.error("Failed to delete investigation:", error);
    showMessage("Failed to delete investigation", "error");
  }
}

/**
 * Duplicate an investigation
 */
async function duplicateInvestigation(stateId: string) {
  try {
    const duplicate = await duplicateGraphState(stateId);
    await loadSavedStates();
    showMessage(`Duplicated as "${duplicate.name}"`, "success");
  } catch (error) {
    console.error("Failed to duplicate investigation:", error);
    showMessage("Failed to duplicate investigation", "error");
  }
}

/**
 * Export investigation to JSON file
 */
async function exportInvestigation(stateId: string) {
  try {
    const state = await loadGraphState(stateId);
    if (!state) return;

    const json = exportGraphState(state);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.name.replace(/[^a-z0-9]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showMessage("Investigation exported", "success");
  } catch (error) {
    console.error("Failed to export investigation:", error);
    showMessage("Failed to export investigation", "error");
  }
}

/**
 * Import investigation from JSON file
 */
function importInvestigation() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = async (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = await importGraphState(text);
      await loadSavedStates();
      showMessage(`Imported "${imported.name}"`, "success");
    } catch (error) {
      console.error("Failed to import investigation:", error);
      showMessage("Failed to import investigation", "error");
    }
  };
  input.click();
}

/**
 * Create new investigation
 */
function createNewInvestigation() {
  currentInvestigationId.value = null;
  currentInvestigationName.value = "Untitled Investigation";
  setLastActiveState(null);
  graphStore.clearGraph();
  showMessage("Started new investigation", "info");
}

/**
 * Rename investigation inline
 */
function startRenaming() {
  isEditingName.value = true;
}

function finishRenaming() {
  isEditingName.value = false;
}

// Expose investigation state and functions for parent component (App.vue)
defineExpose({
  // State
  currentInvestigationId,
  currentInvestigationName,
  isEditingName,
  savedStatesDialog,
  savedStates,
  loadingStates,
  // Functions
  saveCurrentInvestigation,
  loadSavedStates,
  restoreInvestigation,
  deleteInvestigation,
  duplicateInvestigation,
  exportInvestigation,
  importInvestigation,
  createNewInvestigation,
  startRenaming,
  finishRenaming,
});
</script>

<style scoped>
.graph-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.graph-canvas {
  position: relative; /* Establishes positioning context for G6 plugins */
  width: 100%;
  height: 100%;
}

.graph-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.data-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.status-bar {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

/* Event node styles (injected into G6 HTML nodes) */
/* Collapsed node (square with rounded corners) */
:deep(.node-circle) {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

:deep(.node-circle:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* Tree root node marker (red border) */
:deep(.node-circle.tree-root-node) {
  border: 3px solid #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

:deep(.node-circle.tree-root-node:hover) {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* Virtual tree root node (for disconnected graphs) */
:deep(.node-circle.virtual-root-node) {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2);
  pointer-events: none; /* Not clickable */
  opacity: 0.9;
}

:deep(.node-circle.virtual-root-node .node-emoji) {
  font-size: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

:deep(.node-circle.pubkey-node) {
  border: 2px solid rgba(99, 102, 241, 0.3);
}

:deep(.node-circle.pubkey-node.with-picture) {
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  border: 2px solid rgba(99, 102, 241, 0.5);
}

:deep(.node-circle.pubkey-node:hover) {
  transform: scale(1.05);
  box-shadow: 0 3px 10px rgba(99, 102, 241, 0.3);
}

:deep(.node-circle.pubkey-node.with-picture:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Selected collapsed node state */
:deep(.node-circle.selected-collapsed) {
  border: 3px solid #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(59, 130, 246, 0.25) !important;
  transform: scale(1.05);
  z-index: 10;
}

/* Multi-selected nodes (shift+click or brush selection) */
:deep(.node-circle.g6-selected),
:deep(.event-node.g6-selected) {
  outline: 3px solid #10b981 !important;
  outline-offset: 2px;
  box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.2) !important;
}

:deep(.profile-picture) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

:deep(.node-circle.tag-node) {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-width: 4px;
  border-style: solid;
}

:deep(.node-circle.tag-node:hover) {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

:deep(.node-tag-label) {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  user-select: none;
  text-align: center;
  line-height: 1;
}

:deep(.node-circle.loading) {
  background: #ccc;
}

:deep(.node-emoji) {
  font-size: 28px;
  line-height: 1;
}

/* Window node (expanded state) */
:deep(.event-node) {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* Selected card state */
:deep(.event-node.selected) {
  border: 3px solid #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 12px 28px rgba(0, 0, 0, 0.14);
}

:deep(.event-titlebar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  user-select: none;
  cursor: pointer;
  /* Background color is set inline via style attribute based on kind */
}

:deep(.event-left) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

:deep(.event-badge) {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 600;
}

:deep(.event-title) {
  font-weight: 600;
  font-size: 13px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.event-close) {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  line-height: 22px;
  text-align: center;
  font-weight: 800;
  font-size: 18px;
  user-select: none;
  flex-shrink: 0;
  transition: all 0.2s;
}

:deep(.event-close:hover) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

:deep(.event-preview) {
  padding: 12px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.event-body) {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  min-height: 0; /* Important for flexbox scrolling */
}

:deep(.event-meta) {
  font-size: 11px;
  color: #666;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:deep(.event-meta > div) {
  margin-bottom: 4px;
}

:deep(.event-content) {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #333;
}

/* Event card author section */
:deep(.event-author) {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

:deep(.author-avatar) {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
}

:deep(.author-info) {
  flex: 1;
  min-width: 0;
}

:deep(.author-name) {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Event tags */
:deep(.event-tags) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  margin-bottom: 8px;
}

:deep(.tag-badge) {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.tag-badge:hover) {
  background: rgba(245, 158, 11, 0.2);
}

/* Event mentions */
:deep(.event-mentions) {
  font-size: 11px;
  color: #666;
  margin-top: 10px;
  margin-bottom: 8px;
}

:deep(.mentions-label) {
  font-weight: 600;
  margin-right: 6px;
}

:deep(.mention-badge) {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  cursor: pointer;
  margin-right: 4px;
  transition: all 0.2s;
}

:deep(.mention-badge:hover) {
  background: rgba(99, 102, 241, 0.2);
}

:deep(.mention-more) {
  color: #999;
  font-style: italic;
}

/* Event footer - always visible at bottom */
:deep(.event-footer) {
  flex-shrink: 0;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: #fafafa;
}

/* Event stats */
:deep(.event-stats) {
  display: flex;
  gap: 16px;
}

:deep(.stat-item) {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

:deep(.stat-item.has-count) {
  color: #333;
  font-weight: 600;
}

:deep(.stat-item:hover) {
  color: #6366f1;
  transform: translateY(-1px);
}

/* Thread indicator in titlebar */
:deep(.thread-indicator) {
  font-size: 14px;
  opacity: 0.7;
}

:deep(.collapsed .event-body) {
  display: none;
}

/* Kind-specific colors */
:deep(.kind-0) {
  border-color: rgba(59, 109, 255, 0.4);
}

:deep(.kind-1) {
  border-color: rgba(35, 164, 85, 0.4);
}

:deep(.kind-3) {
  border-color: rgba(242, 165, 43, 0.4);
}

:deep(.kind-7) {
  border-color: rgba(255, 99, 132, 0.4);
}

/* Dark theme support */
.v-theme--dark :deep(.event-node) {
  background: rgba(30, 30, 30, 0.98);
  border-color: rgba(255, 255, 255, 0.2);
}

.v-theme--dark :deep(.event-node.selected) {
  border: 3px solid #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2), 0 12px 28px rgba(0, 0, 0, 0.3);
}

.v-theme--dark :deep(.event-titlebar) {
  border-bottom-color: rgba(255, 255, 255, 0.1);
  /* Background color is set inline via style attribute based on kind */
}

.v-theme--dark :deep(.event-content),
.v-theme--dark :deep(.event-preview) {
  color: #e0e0e0;
}

.v-theme--dark :deep(.event-meta) {
  color: #999;
}

.v-theme--dark :deep(.author-name) {
  color: #e0e0e0;
}

.v-theme--dark :deep(.event-author) {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.v-theme--dark :deep(.event-footer) {
  border-top-color: rgba(255, 255, 255, 0.1);
  background: #1a1a1a;
}

.v-theme--dark :deep(.event-stats) {
  /* No border needed - footer has it */
}

.v-theme--dark :deep(.stat-item) {
  color: #666;
}

.v-theme--dark :deep(.stat-item.has-count) {
  color: #e0e0e0;
}

.v-theme--dark :deep(.event-mentions) {
  color: #999;
}

.v-theme--dark :deep(.event-content) {
  color: #e0e0e0;
}

/* Profile card specific styles */
:deep(.profile-card) {
  border-color: rgba(99, 102, 241, 0.4);
}

:deep(.profile-card .event-titlebar) {
  background: linear-gradient(#fafafa, #f1f1f1);
}

:deep(.profile-card .event-badge) {
  border: 1px solid rgba(0, 0, 0, 0.14);
  background: rgba(0, 0, 0, 0.03);
  color: #333;
}

:deep(.profile-card .event-title) {
  color: #333;
}

:deep(.profile-card .event-close) {
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: #fff;
  color: #333;
}

:deep(.profile-card .event-close:hover) {
  background: #f5f5f5;
}

:deep(.profile-picture-large) {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:deep(.profile-picture-large img) {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(99, 102, 241, 0.3);
}

:deep(.profile-bio) {
  font-style: italic;
  color: #555;
  white-space: pre-wrap;
}

.v-theme--dark :deep(.profile-bio) {
  color: #aaa;
}

.v-theme--dark :deep(.profile-card .event-titlebar) {
  background: linear-gradient(#2a2a2a, #1e1e1e);
}

.v-theme--dark :deep(.profile-card .event-badge) {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
}

.v-theme--dark :deep(.profile-card .event-title) {
  color: #e0e0e0;
}

.v-theme--dark :deep(.profile-card .event-close) {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.v-theme--dark :deep(.profile-card .event-close:hover) {
  background: rgba(255, 255, 255, 0.15);
}

/* New minimalistic card design */
:deep(.nostr-card) {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0;
  width: 100%;
  max-width: 600px;
  min-width: 400px;
  box-sizing: border-box;
  font-family: system-ui, -apple-system, sans-serif;
  transition: box-shadow 0.2s;
}

:deep(.nostr-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Card Header */
:deep(.card-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.card-header-left) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.kind-badge) {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.thread-indicator) {
  font-size: 14px;
  opacity: 0.7;
}

:deep(.card-close) {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

:deep(.card-close:hover) {
  background: #f3f4f6;
  color: #111827;
}

/* Author Section */
:deep(.card-author) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

:deep(.card-author:hover) {
  background: #f9fafb;
}

:deep(.author-avatar) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  color: white;
}

:deep(.author-info) {
  flex: 1;
  min-width: 0;
}

:deep(.author-name) {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.card-timestamp) {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* Content Section */
:deep(.card-content) {
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  max-height: 400px;
  overflow-y: auto;
  word-wrap: break-word;
}

:deep(.markdown-content) {
  white-space: pre-wrap;
}

:deep(.markdown-content p) {
  margin: 0 0 12px 0;
}

:deep(.markdown-content p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-content a) {
  color: #3b82f6;
  text-decoration: none;
}

:deep(.markdown-content a:hover) {
  text-decoration: underline;
}

:deep(.markdown-content pre) {
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

/* Tags Section */
:deep(.card-tags) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
}

:deep(.tag-badge) {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.tag-badge:hover) {
  background: #dbeafe;
  transform: translateY(-1px);
}

/* Mentions Section */
:deep(.card-mentions) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
}

:deep(.mentions-label) {
  color: #6b7280;
  font-weight: 500;
}

:deep(.mention-badge) {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.mention-badge:hover) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

:deep(.mention-more) {
  color: #6b7280;
  font-style: italic;
}

/* Footer Section */
:deep(.card-footer) {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

:deep(.footer-stat) {
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}

:deep(.footer-stat:hover) {
  color: #111827;
}

:deep(.footer-stat.has-count) {
  cursor: pointer;
}

:deep(.footer-stat.has-count:hover) {
  color: #2563eb;
  text-decoration: underline;
}

:deep(.footer-stat.no-count) {
  opacity: 0.5;
  cursor: default;
}

:deep(.footer-stat.no-count:hover) {
  color: #6b7280;
  text-decoration: none;
}

:deep(.footer-stats) {
  display: flex;
  gap: 12px;
  flex: 1;
}

/* Loading state for expanding nodes */
:deep(.node-loading) {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Dark theme support for new cards */
.v-theme--dark :deep(.nostr-card) {
  background: #1f2937;
  border-color: #374151;
}

.v-theme--dark :deep(.card-header),
.v-theme--dark :deep(.card-tags),
.v-theme--dark :deep(.card-mentions),
.v-theme--dark :deep(.card-footer) {
  border-color: #374151;
}

.v-theme--dark :deep(.card-author:hover) {
  background: #111827;
}

.v-theme--dark :deep(.card-close) {
  color: #9ca3af;
}

.v-theme--dark :deep(.card-close:hover) {
  background: #374151;
  color: #f3f4f6;
}

.v-theme--dark :deep(.author-name),
.v-theme--dark :deep(.card-content) {
  color: #f3f4f6;
}

.v-theme--dark :deep(.card-timestamp),
.v-theme--dark :deep(.footer-stat),
.v-theme--dark :deep(.mentions-label) {
  color: #9ca3af;
}

.v-theme--dark :deep(.tag-badge) {
  background: #1e3a8a;
  color: #93c5fd;
}

.v-theme--dark :deep(.tag-badge:hover) {
  background: #1e40af;
}

.v-theme--dark :deep(.mention-badge) {
  background: #374151;
  color: #e5e7eb;
}

.v-theme--dark :deep(.mention-badge:hover) {
  background: #4b5563;
}

.v-theme--dark :deep(.markdown-content pre) {
  background: #111827;
  color: #e5e7eb;
}

.v-theme--dark :deep(.card-footer) {
  background: #111827;
}

/* Relay management styles */
.relay-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.relay-item:last-child {
  border-bottom: none;
}

.relay-info {
  flex: 1;
  min-width: 0;
}

.relay-url {
  font-weight: 500;
  font-size: 14px;
  word-break: break-all;
  margin-bottom: 4px;
}

.relay-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.relay-details > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.relay-error {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(211, 47, 47, 0.1);
  border-radius: 4px;
}

.relay-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.v-theme--dark .relay-item {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.v-theme--dark .relay-details {
  color: rgba(255, 255, 255, 0.6);
}

.v-theme--dark .relay-error {
  color: #ef5350;
  background: rgba(239, 83, 80, 0.15);
}

/* Multi-selection rectangle overlay */
/* Multi-selected nodes */
:deep(.node-circle.multi-selected),
:deep(.event-node.multi-selected) {
  border: 3px solid #10b981 !important;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(16, 185, 129, 0.25) !important;
}

:deep(.node-circle.multi-selected) {
  transform: scale(1.05);
  z-index: 10;
}
</style>
