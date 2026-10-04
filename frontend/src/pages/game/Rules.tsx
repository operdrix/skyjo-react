import Rules from "@/components/game/Rules";

const RulesPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-6">
      <div className="flex flex-col justify-center w-full">
        <div className="hero panel min-h-[50vh] my-4">
          <div className="hero-content text-center">
            <Rules />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
