<script>
import { SOME, NONE } from './selection';
import { queryParamsFor } from '@/plugins/extend-router';
import { SORT_BY, DESCENDING } from '@/config/query-params';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: { Checkbox },
  props:      {
    columns: {
      type:     Array,
      required: true
    },
    sortBy: {
      type:     String,
      required: true
    },
    defaultSortBy: {
      type:    String,
      default: ''
    },
    descending: {
      type:     Boolean,
      required: true
    },
    tableActions: {
      type:     Boolean,
      required: true,
    },
    rowActions: {
      type:     Boolean,
      required: true,
    },
    howMuchSelected: {
      type:     String,
      required: true,
    },
    checkWidth: {
      type:     Number,
      default:  30,
    },
    rowActionsWidth: {
      type:     Number,
      required: true
    },
    subExpandColumn: {
      type:    Boolean,
      default: false,
    },
    expandWidth: {
      type:    Number,
      default: 30,
    }
  },

  computed: {
    isAll: {
      get() {
        return this.howMuchSelected !== NONE;
      },

      set(value) {
        this.$emit('on-toggle-all', value);
      }
    },

    isIndeterminate() {
      return this.howMuchSelected === SOME;
    }
  },

  methods: {
    changeSort(e, col) {
      if ( !col.sort ) {
        return;
      }

      let desc = false;

      if ( this.sortBy === col.name ) {
        desc = !this.descending;
      }

      this.$emit('on-sort-change', col.name, desc);
    },

    isCurrent(col) {
      return col.name === this.sortBy;
    },

    queryFor(col) {
      const query = queryParamsFor(this.$route.query, {
        [SORT_BY]:    col.name,
        [DESCENDING]: this.isCurrent(col) && !this.descending,
      }, {
        [SORT_BY]:    this.defaultSortBy,
        [DESCENDING]: false,
      });

      return query;
    },

    label(col) {
      if ( col.labelKey ) {
        return this.t(col.labelKey, undefined, true);
      }

      return col.label;
    }
  }
};
</script>

<template>
  <thead>
    <tr>
      <th v-if="tableActions" :width="checkWidth" align="middle">
        <Checkbox
          v-model="isAll"
          class="check"
          type="checkbox"
          :indeterminate="isIndeterminate"
        />
      </th>
      <th v-if="subExpandColumn" :width="expandWidth"></th>
      <th
        v-for="col in columns"
        :key="col.name"
        :align="col.align || 'left'"
        :width="col.width"
        :class="{ sortable: col.sort }"
        @click.prevent="changeSort($event, col)"
      >
        <nuxt-link v-if="col.sort" :to="{query: queryFor(col)}">
          {{ label(col) }}
          <span class="icon-stack">
            <i class="icon icon-sort icon-stack-1x faded" />
            <i v-if="isCurrent(col) && !descending" class="icon icon-sort-down icon-stack-1x" />
            <i v-if="isCurrent(col) && descending" class="icon icon-sort-up icon-stack-1x" />
          </span>
        </nuxt-link>
        <span v-else>{{ label(col) }}</span>
      </th>
      <th v-if="rowActions" :width="rowActionsWidth">
      </th>
    </tr>
  </thead>
</template>
