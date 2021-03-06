<script>
import _ from 'lodash';
import { STATE, AGE, NAMESPACE_NAME, TYPE } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import {
  CATALOG, HELM, WORKLOAD_TYPES, SERVICE, DEVICE_PROTOCOL, SCHEMA
} from '@/config/types';
import { deviceDefaultInfo } from '@/config/map';
import { allHash } from '@/utils/promise';

export default {
  name:       'Application',
  components: { SortableTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
    // The things out of asyncData come in as props
    resources: {
      type:    Object,
      default: null,
    },
  },

  async asyncData({ store }) {
    const resources = await allHash({
      deployment:  store.dispatch('management/findAll', { type: WORKLOAD_TYPES.DEPLOYMENT }),
      daemonSet:   store.dispatch('management/findAll', { type: WORKLOAD_TYPES.DAEMON_SET }),
      statefulSet: store.dispatch('management/findAll', { type: WORKLOAD_TYPES.STATEFUL_SET }),
      batchJob:    store.dispatch('management/findAll', { type: WORKLOAD_TYPES.JOB }),
      service:     store.dispatch('management/findAll', { type: SERVICE }),
      helm:        store.dispatch('management/findAll', { type: HELM }),
      catalogs:    store.dispatch('management/findAll', { type: CATALOG })
    });

    return { resources };
  },

  data() {
    return {};
  },

  computed: {
    headers() {
      return [
        STATE,
        {
          ...NAMESPACE_NAME,
          width: 300
        },
        {
          ...TYPE,
          width: 200
        },
        {
          name:      'service',
          label:     'Service',
          formatter: 'Service',
          value:     "$['metadata']['annotations']['field.cattle.io/publicEndpoints']"
        },
        AGE,
      ];
    },

    rows() {
      const out = [];
      const helm = this.resources.helm;
      const mapKey = ['app.kubernetes.io/instance', 'release'];

      for (const typeRows of helm) {
        const name = typeRows.metadata.name;
        const { chart, targetNamespace } = typeRows.spec;
        const id = typeRows.id;

        typeRows.customId = id;
        out.push(typeRows);

        for (const row of [...this.resources.statefulSet, ...this.resources.daemonSet, ...this.resources.deployment, ...this.resources.batchJob, ...this.resources.service]) {
          if ( row.metadata.namespace === targetNamespace && row.metadata?.labels?.['app.kubernetes.io/instance'] === name && row.metadata?.labels['app.kubernetes.io/name'] === chart) {
            out.push(row);
            row.customId = id;
            break;
          }

          if (row.metadata?.labels?.['release'] === name) {
            row.customId = id;
            out.push(row);
          }
        }
      }

      return out;
    },

    groupBy() {
      return 'customId';
    },

    entries() {
      const entries = {};

      this.resources.catalogs.forEach( (C) => {
        const name = C.metadata?.name;

        entries[name] = C.spec.indexFile;
      });

      return entries;
    }
  },

  methods: {
    getVersion(group) {
      const helm = group.rows.find( (row) => {
        return row.kind === 'HelmChart';
      });
      const { version, chart, repo } = helm.spec;
      const name = helm.metadata?.annotations['octopusapi.cattle.io/catalogs'];
      const versions = _.sortBy(this.entries[name]?.entries?.[chart] || [], (C) => {
        return -C.version;
      });

      if (version === versions?.[0]?.version) {
        return { isOld: false };
      }

      return {
        isOld: true,
        url:   `/c/local/helm.cattle.io.helmchart/${ helm.metadata.namespace }/${ helm.metadata.name }?mode=edit`
      };
    }
  },
};
</script>

<template>
  <SortableTable
    v-bind="$attrs"
    :headers="headers"
    :rows="rows"
    :group-by="groupBy"
    :paging="true"
    key-field="_key"
    v-on="$listeners"
  >
    <template #group-by="{group}">
      <tr class="group-row">
        <td :colspan="4">
          <div class="group-tab">
            {{ group.ref }} <nuxt-link v-if="getVersion(group).isOld" :to="getVersion(group).url" class="version">
              有新版本可更新
            </nuxt-link>
          </div>
        </td>
      </tr>
    </template>
  </SortableTable>
</template>

<style lang="scss" scoped>
.version {
  margin-top: 0 !important;
  background: #f1c40f;
  color: #3d3d3d;
  padding: 2px 3px;
  line-height: 20px;
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 0 solid transparent;
  letter-spacing: .5px;
  border-radius: 1.5px;
}
</style>
