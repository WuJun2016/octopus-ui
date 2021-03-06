<script>
import ArrayList from '@/components/form/ArrayList';
import KeyValue from '@/components/form/KeyValue';
import { _VIEW } from '@/config/query-params';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

const CLUSTER_FIRST = 'ClusterFirst';
const CLUSTER_FIRST_HOST = 'ClusterFirstWithHostNet';

export default {
  components: {
    ArrayList, KeyValue, LabeledInput, LabeledSelect
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
  },

  data() {
    const hostAliases = (this.value.hostAliases || []).map((entry) => {
      return {
        ip:        entry.ip,
        hostnames: entry.hostnames.join(', ')
      };
    });

    const { dnsConfig = {}, hostname, subdomain } = this.value;
    const { nameservers, searches, options = [] } = dnsConfig;

    const out = {
      dnsPolicy:   this.value.dnsPolicy || 'Default',
      networkMode: this.value.hostNetwork ? 'host' : 'normal',
      hostAliases,
      nameservers,
      searches,
      hostname,
      subdomain,
      options
    };

    return out;
  },

  computed: {
    dnsPolicyChoices() {
      return [
        { label: 'Default', value: 'Default' },
        { label: 'ClusterFirst', value: 'Cluster First' },
        { label: 'None', value: 'None' },
      ];
    },

    networkModeChoices() {
      return [
        { label: 'Normal', value: 'normal' },
        { label: 'Host Network', value: 'host' },
      ];
    },

    isView() {
      return this.mode === _VIEW;
    }
  },

  watch: {
    networkMode(neu) {
      const on = neu === 'host';

      this.value.hostNetwork = on;
      if ( this.dnsPolicy === CLUSTER_FIRST ) {
        if ( on ) {
          this.value.dnsPolicy = CLUSTER_FIRST_HOST;
        } else {
          this.value.dnsPolicy = CLUSTER_FIRST;
        }
      }
    },

    dnsPolicy(neu) {
      if ( neu === CLUSTER_FIRST ) {
        if ( this.networkMode === 'host' ) {
          this.value.dnsPolicy = CLUSTER_FIRST_HOST;
        } else {
          this.value.dnsPolicy = CLUSTER_FIRST;
        }
      } else {
        this.value.dnsPolicy = neu;
      }
    }
  },

  methods: {
    formatHostAliases(neu) {
      this.hostAliases = neu.map((entry) => {
        const ip = entry.ip.trim();
        let hostnames;

        if (Array.isArray(entry.hostnames)) {
          hostnames = entry.hostnames;
        } else {
          hostnames = entry.hostnames.trim().split(/[\s,]+/).filter(x => !!x);
        }

        return { ip, hostnames };
      }).filter(entry => entry.ip && entry.hostnames.length);
    },

    updateHostAliases(neu) {
      this.update();
    },

    updateOptions(neu) {
      this.options = neu.map((entry) => {
        const name = entry.name.trim();
        const value = entry.value.trim();

        return { name, value };
      }).filter(entry => entry.name && entry.value.length);
      this.update();
    },

    update() {
      this.formatHostAliases(this.hostAliases);
      const dnsConfig = {
        ...this.dnsConfig,
        nameservers: this.nameservers,
        searches:    this.searches,
        options:     this.options
      };
      const out = {
        ...this.value,
        dnsConfig,
        dnsPolicy:   this.dnsPolicy,
        hostname:    this.hostname,
        hostAliases: this.hostAliases,
        subdomain:   this.subdomain,
        hostNetwork: (this.networkMode === 'host')
      };

      this.$emit('input', out);
    }
  }
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="networkMode"
          :mode="mode"
          :options="networkModeChoices"
          :label="t('workload.networking.mode.label')"
          :placeholder="t('workload.networking.mode.placeholder')"
          @input="update"
        />
      </div>

      <div class="col span-6">
        <LabeledSelect
          v-model="dnsPolicy"
          :mode="mode"
          :options="dnsPolicyChoices"
          :label="t('workload.networking.dnsPolicy.label')"
          :placeholder="t('workload.networking.dnsPolicy.placeholder')"
          @input="update"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="hostname"
          :label="t('workload.networking.hostname.label')"
          :mode="mode"
          :placeholder="t('workload.networking.hostname.placeholder')"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="subdomain"
          :label="t('workload.networking.subdomain.label')"
          :mode="mode"
          :placeholder="t('workload.networking.subdomain.placeholder')"
          @input="update"
        />
      </div>
    </div>

    <el-divider v-if="!isView"></el-divider>

    <div class="row">
      <div class="col span-6">
        <ArrayList
          key="dnsNameservers"
          v-model="nameservers"
          :title="t('workload.networking.nameservers.label')"
          :value-placeholder="t('workload.networking.nameservers.placeholder')"
          :value-multiline="false"
          :mode="mode"
          :pad-left="false"
          :protip="false"
          :add-label="t('workload.networking.nameservers.addLabel')"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <ArrayList
          key="dnsSearches"
          v-model="searches"
          :title="t('workload.networking.searchDomains.label')"
          :value-placeholder="t('workload.networking.searchDomains.placeholder')"
          :add-label="t('workload.networking.searchDomains.addLabel')"
          :value-multiline="false"
          :mode="mode"
          :pad-left="false"
          :protip="false"
          @input="update"
        />
      </div>
    </div>

    <el-divider v-if="!isView"></el-divider>

    <div class="row">
      <KeyValue
        v-model="options"
        :mode="mode"
        :title="t('workload.networking.resolvingServers.label')"
        :read-allowed="false"
        :as-map="false"
        key-name="name"
        :key-placeholder="t('workload.networking.resolvingServers.placeholder')"
        value-name="value"
        :value-placeholder="t('workload.networking.resolvingServers.valuePlaceholder')"
        :add-label="t('workload.networking.resolvingServers.addLabel')"
        :pad-left="false"
        @input="updateOptions"
      />
    </div>

    <el-divider v-if="!isView"></el-divider>

    <div class="row">
      <div class="col span-12">
        <KeyValue
          key="hostAliases"
          v-model="hostAliases"
          :mode="mode"
          :title="t('workload.networking.hostAlias.label', undefined, true)"
          :protip="t('workload.networking.hostAlias.tip', undefined, true)"
          :read-allowed="false"
          :as-map="false"
          key-name="ip"
          :key-label="t('workload.networking.hostAlias.ip.label')"
          :key-placeholder="t('workload.networking.hostAlias.ip.placeholder')"
          value-name="hostnames"
          :value-label="t('workload.networking.hostAlias.host.label')"
          :value-placeholder="t('workload.networking.hostAlias.host.placeholder')"
          :pad-left="false"
          :add-label="t('workload.networking.hostAlias.addLabel')"
          @input="updateHostAliases"
        />
      </div>
    </div>
  </div>
</template>
