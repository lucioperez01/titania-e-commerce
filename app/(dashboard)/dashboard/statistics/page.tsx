import IncomeGraph from "../graph/incomegraph";

export default function StatisticsPage() {
    return (
        <div className="flex flex-col justify-center items-center space-y-5 md:p-10 text-white animate-in fade-in duration-500 w-full">
            <IncomeGraph />

        </div>
    );
}