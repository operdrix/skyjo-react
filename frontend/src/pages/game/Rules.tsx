import Rules from "@/components/game/Rules";

const RulesPage = () => {

  return (
    <div className="flex-1 container mx-auto flex items-center">
      <div className="flex flex-col justify-center w-full">
        <div className="hero bg-base-200 sm:rounded-box min-h-[50vh] my-4">
          <div className="hero-content text-center">
            <Rules />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RulesPage

