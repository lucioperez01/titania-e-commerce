import IncomeGraph from "../graph/incomegraph";
import { getWeeklyIncomeAction } from "../orders/actions";

export default async function StatisticsPage() {
    const weeklyIncome = await getWeeklyIncomeAction();

    return (
        <div className="flex flex-col justify-center items-center space-y-5 md:p-10 text-white animate-in fade-in duration-500 w-full">
            <IncomeGraph data={weeklyIncome} />

        </div>
    );
}