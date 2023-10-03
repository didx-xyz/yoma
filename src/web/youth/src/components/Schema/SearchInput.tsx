import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import { SelectOption } from "~/api/models/lookups";
import { getSchemaEntities } from "~/api/services/credentials";
import Select from "react-select";

interface InputProps {
  defaultValue?: string[] | null;
  onChange?: (attributes: string[]) => void;
}
interface ISchemaViewModel {
  attributes: ISchemaAttributeViewModel[];
}
interface ISchemaAttributeViewModel {
  dataSource: string;
  attribute: string;
  attributes: SelectOption[];
}

export const SchemaAttributesEdit: React.FC<InputProps> = ({
  defaultValue,

  onChange,
}) => {
  const { data: schemaEntities } = useQuery({
    queryKey: ["schemaEntities"],
    queryFn: () => getSchemaEntities(),
  });
  const schemaEntitiesSelectOptions = useMemo<SelectOption[]>(
    () =>
      schemaEntities?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [schemaEntities],
  );

  const { control } = useForm<ISchemaViewModel>({
    defaultValues: {
      attributes: defaultValue?.map((x) => ({
        attribute: x,
        dataSource: schemaEntities?.find(
          (a) => a.properties?.find((y) => y.attributeName == x),
        )?.id,
        attributes: schemaEntities
          ?.find((a) => a.properties?.find((y) => y.attributeName == x))
          ?.properties?.map((x) => ({
            value: x.attributeName,
            label: x.attributeName,
          })),
      })),
    },
  });
  const { fields, append, remove, update } = useFieldArray<ISchemaViewModel>({
    control,
    name: "attributes",
  });

  // call onChange each time fields changes
  useEffect(() => {
    if (onChange)
      onChange(fields.map((x: any) => x.attribute).filter((x) => x != ""));
  }, [fields, onChange]);

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field: any, index) => (
        <div key={field.id} className="flex flex-row gap-2">
          <Select
            // classNames={{
            //   control: () => "input input-bordered flex flex-grow",
            // }}
            styles={{
              container: (css) => ({
                ...css,
                width: "100%",
              }),
            }}
            placeholder="Select data source"
            isMulti={false}
            options={schemaEntitiesSelectOptions}
            onChange={(val, e) => {
              update(index, {
                dataSource: val?.value!,
                attribute: "", // clear
                attributes:
                  schemaEntities
                    ?.find((x) => x.id == val?.value!)
                    ?.properties?.map((x) => ({
                      value: x.attributeName,
                      label: x.attributeName,
                    })) ?? [],
              });
            }}
            value={
              schemaEntitiesSelectOptions.find(
                (x) => x.value == field.dataSource,
              )!
            }
          />
          <Select
            // classNames={{
            //   control: () => "input input-bordered  flex flex-grow",
            // }}
            styles={{
              container: (css) => ({
                ...css,
                width: "100%",
              }),
            }}
            placeholder="Select attribute"
            isMulti={false}
            options={field.attributes}
            onChange={(val) => {
              update(index, {
                dataSource: field.dataSource,
                attribute: val?.value!,
                attributes: field.attributes,
              });
            }}
            value={
              field?.attributes.find((x: any) => x.value == field.attribute)!
            }
          />
          <div className="flex">
            <button
              type="button"
              className="btn btn-error btn-sm"
              onClick={() => remove(index)}
            >
              <IoIosRemove className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex justify-center">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() =>
            append({ dataSource: "", attribute: "", attributes: [] })
          }
        >
          <IoIosAdd className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
