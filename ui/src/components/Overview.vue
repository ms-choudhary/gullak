<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { DonutChart } from '@/components/ui/chart-donut';
import { AreaChart } from '@/components/ui/chart-area'
import { CurveType } from '@unovis/ts';
import { showToast } from '@/utils/common'
import { describeError } from '@/utils/errors'
import DateRangePicker from '@/components/DateRangePicker.vue';
import TransactionTable from '@/components/TransactionTable.vue';
import EnvelopeSelect from '@/components/EnvelopeSelect.vue';
import SearchFilters from '@/components/SearchFilters.vue';
import { useTransactionStore } from '@/stores/transactions';
import type { DailySpending, Transaction } from '@/types/transaction';

const transactionStore = useTransactionStore();
const categoriesData = ref<Array<{ name: string; total: number }>>([]);
const dailyData = ref<DailySpending[]>([]);
const transactions = ref<Transaction[]>([]);
const availableEnvelopes = ref<string[]>([]);
const selectedEnvelope = ref<string | null>(null);
const selectedCategory = ref<string | null>(null);

const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const todayStr = () => formatDate(new Date());

const startOfMonthStr = () => {
    const now = new Date();
    return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const dateRange = ref({ start: startOfMonthStr(), end: todayStr() });

// The API has no wildcard: an omitted `envelopes` param matches nothing, so
// "All envelopes" has to enumerate every envelope by name.
const envelopesForQuery = computed(() =>
    selectedEnvelope.value === null ? availableEnvelopes.value : [selectedEnvelope.value]
);

// Client-side filters over the transactions already loaded in the table.
const descriptionQuery = ref('');
const sourceFilter = ref<string | null>(null);

const availableSources = computed(() =>
    [...new Set(transactions.value.map(t => t.source ?? ''))].sort()
);

const visibleTransactions = computed(() => {
    const query = descriptionQuery.value.trim().toLowerCase();
    return transactions.value.filter(t => {
        const matchesQuery = !query || (t.description ?? '').toLowerCase().includes(query);
        const matchesSource = sourceFilter.value === null || (t.source ?? '') === sourceFilter.value;
        return matchesQuery && matchesSource;
    });
});

const isFiltering = computed(() => descriptionQuery.value.trim() !== '' || sourceFilter.value !== null);

watch(availableSources, (sources) => {
    if (sourceFilter.value !== null && !sources.includes(sourceFilter.value)) {
        sourceFilter.value = null;
    }
});

const fetchChartData = async () => {
    const [dailySpending, categories] = await Promise.all([
        transactionStore.fetchDailySpending(dateRange.value.start, dateRange.value.end, envelopesForQuery.value),
        transactionStore.fetchTopExpenseCategories(dateRange.value.start, dateRange.value.end, envelopesForQuery.value)
    ]);
    dailyData.value = dailySpending.map(day => ({
        transaction_date: day.transaction_date,
        total_spent: day.total_spent
    }));
    categoriesData.value = categories.map(item => ({
        name: item.category,
        total: item.total_spent
    }));
}

const fetchTableData = async () => {
    transactions.value = await transactionStore.fetchTransactions(
        true,
        dateRange.value.start,
        dateRange.value.end,
        envelopesForQuery.value,
        selectedCategory.value
    );
}

const fetchData = async () => {
    try {
        await Promise.all([fetchChartData(), fetchTableData()]);
    } catch (error) {
        showToast('Error fetching data.', describeError(error), true);
    }
}

const saveTransactionHandler = async (transaction: Transaction) => {
    try {
        await transactionStore.updateTransaction(transaction);
        showToast('Transaction updated successfully!', '', false);
        // Editing a row is the only way an envelope comes into existence, so the
        // list can change on every save.
        await fetchAvailableEnvelopes();
        fetchData();
    } catch (error) {
        showToast('Error updating transaction.', describeError(error), true);
    }
}

const deleteTransactionHandler = async (transaction: Transaction) => {
    try {
        await transactionStore.deleteTransaction(transaction.id);
        showToast('Transaction deleted successfully!', '', false);
        await fetchAvailableEnvelopes();
        fetchData();
    } catch (error) {
        showToast('Error deleting transaction.', describeError(error), true);
    }
}

const fetchAvailableEnvelopes = async () => {
    try {
        availableEnvelopes.value = await transactionStore.fetchEnvelopes();
    } catch (error) {
        showToast('Error fetching data.', describeError(error), true);
    }
}

const handleDateRangeUpdate = (newDates: { start: string; end: string }) => {
    dateRange.value = { ...dateRange.value, start: newDates.start, end: newDates.end };
    fetchData();
};

const handleEnvelopeChange = async (envelope: string | null) => {
    selectedEnvelope.value = envelope;

    if (envelope === null) {
        dateRange.value = { start: startOfMonthStr(), end: todayStr() };
        await fetchData();
        return;
    }

    try {
        // No start_date means no lower bound, so this is the envelope's entire
        // history, newest first: the last row is its first ever transaction.
        const history = await transactionStore.fetchTransactions(
            true,
            null,
            todayStr(),
            [envelope],
            selectedCategory.value
        );

        const earliest = history.length
            ? history[history.length - 1].transaction_date.split('T')[0]
            : startOfMonthStr();

        dateRange.value = { start: earliest, end: todayStr() };
        transactions.value = history;
        await fetchChartData();
    } catch (error) {
        showToast('Error fetching data.', describeError(error), true);
    }
};

const handleCategoryFilter = (category: string | null) => {
    selectedCategory.value = category;
    fetchTableData();
};

watch(availableEnvelopes, (envelopes) => {
    if (selectedEnvelope.value !== null && !envelopes.includes(selectedEnvelope.value)) {
        handleEnvelopeChange(null);
    }
});

onMounted(async () => {
    await fetchAvailableEnvelopes();
    await fetchData();
});
</script>

<template>
    <section class="p-6">
        <div class="py-4 space-y-3">
            <h1 class="text-2xl font-semibold text-gray-800">Dashboard Overview</h1>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <EnvelopeSelect :model-value="selectedEnvelope" :envelopes="availableEnvelopes"
                    @update:model-value="handleEnvelopeChange" />
                <DateRangePicker v-model="dateRange" @update:dateRange="handleDateRangeUpdate" />
            </div>
        </div>
        <div class="charts mt-4 flex flex-wrap justify-center items-stretch">
            <div class="w-full md:w-1/2 p-2">
                <DonutChart :data="categoriesData" index="name" :category="'total'" class="w-full h-full" @categorySelected="handleCategoryFilter" />
            </div>
            <div class="w-full md:w-1/2 p-2">
                <AreaChart :data="dailyData" index="transaction_date" :categories="['total_spent']"
                    class="w-full h-[200px]" :show-grid-line="false" :show-legend="false"
                    :curve-type="CurveType.Basis" />
            </div>
        </div>
        <div class="transactions mt-4">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 class="text-2xl font-semibold text-gray-800">Transactions Log</h2>
                <div v-if="selectedCategory" class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">Filtered by category:</span>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">{{ selectedCategory }}</span>
                    <button @click="handleCategoryFilter(null)" class="text-sm text-red-600 hover:text-red-800 underline">Clear filter</button>
                </div>
            </div>
            <div class="mb-4">
                <SearchFilters v-model:search="descriptionQuery" v-model:source="sourceFilter"
                    :sources="availableSources" />
                <p v-if="isFiltering" class="mt-2 text-sm text-gray-600">
                    Showing {{ visibleTransactions.length }} of {{ transactions.length }} transactions
                </p>
            </div>
            <TransactionTable :transactions="visibleTransactions" :on-delete="deleteTransactionHandler"
                :on-save="saveTransactionHandler" />
        </div>
    </section>
</template>
