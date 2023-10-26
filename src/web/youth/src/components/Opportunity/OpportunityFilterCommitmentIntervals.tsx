import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import type { SelectOption } from "~/api/models/lookups";
import Select from "react-select";
import type {
  OpportunitySearchCriteriaCommitmentInterval,
  OpportunitySearchFilterCommitmentInterval,
} from "~/api/models/opportunity";

interface InputProps {
  htmlRef: HTMLDivElement;
  lookups_commitmentIntervals: OpportunitySearchCriteriaCommitmentInterval[];
  defaultValue?: OpportunitySearchFilterCommitmentInterval[] | null;
  onChange?: (
    commitmentIntervals: OpportunitySearchFilterCommitmentInterval[],
  ) => void;
}
interface IViewModel {
  filters: ICommitmentIntervalViewModel[];
}
interface ICommitmentIntervalViewModel {
  _id: string; // field array id (keyname)
  id: string;
  count: number;
}

export const OpportunityFilterCommitmentIntervals: React.FC<InputProps> = ({
  htmlRef,
  lookups_commitmentIntervals,
  defaultValue,
  onChange,
}) => {
  const timeIntervalsSelectOptions = useMemo<SelectOption[]>(
    () =>
      lookups_commitmentIntervals?.map((c) => ({
        value: c.id,
        label: c.description,
      })) ?? [],
    [lookups_commitmentIntervals],
  );

  const { control } = useForm<IViewModel>({
    defaultValues: {
      filters: defaultValue ?? [],
    },
  });

  const { fields, append, remove, update } = useFieldArray<
    IViewModel,
    "filters",
    "_id"
  >({
    control,
    name: "filters",
    keyName: "_id",
  });

  // call onChange each time fields changes
  useEffect(() => {
    if (onChange && fields) {
      onChange(fields);
    }
  }, [fields, onChange]);

  return (
    <div className="flex flex-col gap-2">
      <br />
      {/* eslint-disable */}
      {fields.map((field: any, index) => (
        <div key={`${field.id}_${index}`} className="flex flex-row gap-2">
          <Select
            styles={{
              container: (css) => ({
                ...css,
                width: "100%",
              }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }), // fix menu z-index issue
            }}
            menuPortalTarget={htmlRef}
            placeholder="Select time interval"
            isMulti={false}
            options={timeIntervalsSelectOptions}
            onChange={(val) => {
              update(index, {
                _id: field._id,
                id: val?.value!,
                count: field.count,
              });
            }}
            value={timeIntervalsSelectOptions.find((x) => x.value == field.id)!}
          />

          <input
            type="number"
            className="input input-bordered input-sm rounded-md"
            placeholder="Enter description"
            onChange={(e) => {
              update(index, {
                _id: field._id,
                id: field.id,
                count: parseInt(e.target.value),
              });
            }}
            defaultValue={field.count}
            contentEditable
          />
          <div className="flex">
            <button
              type="button"
              className="btn btn-error btn-sm"
              onClick={() => {
                remove(index);
              }}
            >
              <IoIosRemove className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {/* eslint-enable */}
      <div className="flex justify-center">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => append({ _id: "", id: "", count: 0 })}
        >
          <IoIosAdd className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
