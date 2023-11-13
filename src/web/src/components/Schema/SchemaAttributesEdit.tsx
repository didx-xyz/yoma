import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import type { SelectOption } from "~/api/models/lookups";
import { getSchemaEntities } from "~/api/services/credentials";
import Select from "react-select";
import type { SchemaType } from "~/api/models/credential";

interface InputProps {
  defaultValue?: string[] | null;
  schemaType: SchemaType;
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
  schemaType,
  onChange,
}) => {
  const { data: schemaEntities } = useQuery({
    queryKey: ["schemaEntities", schemaType],
    queryFn: () => getSchemaEntities(schemaType),
    enabled: schemaType != null,
  });
  const systemSchemaEntities = useMemo(
    () =>
      schemaEntities?.map((x) => ({
        ...x,
        properties: x.properties?.filter((x) => x.system == true),
      })) ?? [],
    [schemaEntities],
  );

  const additionalSchemaEntitiesSelectOptions = useMemo<SelectOption[]>(
    () =>
      schemaEntities?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [schemaEntities],
  );

  const { control, reset } = useForm<ISchemaViewModel>();
  const { fields, append, remove, update } = useFieldArray<ISchemaViewModel>({
    control,
    name: "attributes",
  });

  // reset form when schemaEntities changes (initially null)
  useEffect(() => {
    if (!schemaEntities) return;

    reset({
      attributes: defaultValue?.map((x) => ({
        attribute: x,
        dataSource: schemaEntities?.find(
          (a) => a.properties?.find((y) => y.attributeName == x),
        )?.id,
        attributes: schemaEntities
          ?.find((a) => a.properties?.find((y) => y.attributeName == x))
          ?.properties?.map((x) => ({
            value: x.attributeName,
            label: x.nameDisplay,
          })),
      })),
    });
  }, [schemaEntities, defaultValue, reset]);

  // call onChange each time fields changes
  useEffect(() => {
    if (onChange)
      // eslint-disable-next-line
      onChange(fields.map((x: any) => x.attribute).filter((x) => x != ""));
    // eslint-enable-next-line
  }, [fields, onChange]);

  return (
    <div className="flex flex-col gap-2">
      {/* SYSTEM ATTRIBUTES (READ ONLY) */}
      <div className="flex flex-col gap-2">
        <label className="label">
          <span className="label-text">System attributes</span>
        </label>

        <table className="table w-full">
          <thead>
            <tr>
              <th>Datasource</th>
              <th>Attribute</th>
            </tr>
          </thead>
          <tbody>
            {systemSchemaEntities.map((attribute, index) => (
              <>
                {attribute.properties?.map((property, index) => (
                  <tr key={`${index}_${property.id}`}>
                    <td>{attribute?.name}</td>
                    <td>{property.nameDisplay}</td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADDITIONAL ATTRIBUTES (WRITE) */}
      {/* eslint-disable */}
      <div className="flex flex-col gap-2">
        <label className="label">
          <span className="label-text">Additional attributes</span>
        </label>

        {fields.map((field: any, index) => (
          <div key={field.id} className="flex flex-row gap-2">
            <Select
              styles={{
                container: (css) => ({
                  ...css,
                  width: "100%",
                }),
              }}
              placeholder="Select data source"
              isMulti={false}
              options={additionalSchemaEntitiesSelectOptions}
              onChange={(val) => {
                update(index, {
                  dataSource: val?.value!,
                  attribute: "", // clear
                  attributes:
                    schemaEntities
                      ?.find((x) => x.id == val?.value!)
                      ?.properties?.filter((x) => x.system == false)
                      .map((x) => ({
                        value: x.attributeName,
                        label: x.nameDisplay,
                      })) ?? [],
                });
              }}
              value={
                additionalSchemaEntitiesSelectOptions.find(
                  (x) => x.value == field.dataSource,
                )!
              }
            />
            <Select
              styles={{
                container: (css) => ({
                  ...css,
                  width: "100%",
                }),
              }}
              placeholder="Select attribute"
              isMulti={false}
              options={field.attributes}
              // options={field.attributes.map(
              //   (x: string) =>
              //     (schemaEntities?.flatMap((y) => y.properties) ?? [])
              //       ?.map((a) => ({
              //         value: a?.attributeName,
              //         label: a?.nameDisplay,
              //       }))
              //       .find((y) => y?.value == x) ?? x,
              // )}
              onChange={(val) => {
                update(index, {
                  dataSource: field.dataSource,
                  attribute: val?.value!,
                  attributes: field.attributes,
                });
              }}
              value={
                field?.attributes?.find((x: any) => x.value == field.attribute)!
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
        {/* eslint-enable */}
      </div>

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
