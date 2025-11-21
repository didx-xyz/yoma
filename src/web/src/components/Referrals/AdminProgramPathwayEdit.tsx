import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Controller,
  useFieldArray,
  useFormState,
  type Control,
} from "react-hook-form";
import { IoMdAdd, IoMdAlert, IoMdTrash } from "react-icons/io";
import Async from "react-select/async";
import type { Opportunity, OpportunityInfo } from "~/api/models/opportunity";
import {
  PathwayCompletionRule,
  PathwayOrderMode,
  PathwayTaskEntityType,
} from "~/api/models/referrals";
import { searchCriteriaOpportunities } from "~/api/services/opportunities";
import { debounce } from "~/lib/utils";
import FormError from "../Common/FormError";
import FormField from "../Common/FormField";
import FormInput from "../Common/FormInput";
import PathwayTaskOpportunity from "./PathwayTaskOpportunity";

const PAGE_SIZE_MEDIUM = 10;

export interface ProgramPathwayEditProps {
  control: Control<any>;
  opportunityDataMap?: Record<string, Opportunity>;
}

export const AdminProgramPathwayEditComponent: React.FC<
  ProgramPathwayEditProps
> = ({ control, opportunityDataMap }) => {
  const { errors } = useFormState({ control });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
    move: moveStep,
  } = useFieldArray({
    control,
    name: "pathway.steps",
  });

  const handleMoveStepUp = (index: number) => {
    if (index > 0) {
      moveStep(index, index - 1);
    }
  };

  const handleMoveStepDown = (index: number) => {
    if (index < stepFields.length - 1) {
      moveStep(index, index + 1);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Pathway Header - Editable */}
      <div className="space-y-4">
        <Controller
          name="pathway.name"
          control={control}
          rules={{ required: "Pathway name is required" }}
          render={({ field, fieldState }) => (
            <FormField
              label="Pathway Name"
              showWarningIcon={!!fieldState.error}
              showError={!!fieldState.isTouched && !!fieldState.error}
              error={fieldState.error?.message}
            >
              <FormInput
                inputProps={{
                  type: "text",
                  placeholder: "e.g., Onboarding Journey",
                  ...field,
                }}
              />
            </FormField>
          )}
        />

        <Controller
          name="pathway.description"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Pathway Description (Optional)"
              showWarningIcon={!!fieldState.error}
              showError={!!fieldState.isTouched && !!fieldState.error}
              error={fieldState.error?.message}
            >
              <textarea
                placeholder="Describe the pathway journey..."
                className="textarea textarea-bordered w-full text-sm"
                rows={2}
                {...field}
                value={field.value ?? ""}
              />
            </FormField>
          )}
        />
      </div>

      {/* Steps Section */}
      <div className="flex items-center justify-between">
        <h6 className="font-semibold text-gray-800">
          Steps ({stepFields.length})
        </h6>
      </div>

      {stepFields.length === 0 ? (
        <div className="flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex w-full flex-row rounded-lg">
            <IoMdAlert className="text-yellow mr-2 h-6 w-6 flex-none" />
            <span className="content-center text-sm font-medium text-yellow-800">
              No steps added yet
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              appendStep({
                name: "",
                description: null,
                rule: PathwayCompletionRule.All,
                orderMode: PathwayOrderMode.Sequential,
                tasks: [],
              });
            }}
            className="btn btn-xs tooltip bg-blue-500 text-white"
            data-tip="Add Step"
          >
            <IoMdAdd className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-4">
          {/* Step Instruction Header */}
          {stepFields.length > 1 ? (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-xs font-bold text-blue-600">
                  ✓
                </span>
                Complete{" "}
                <Controller
                  name="pathway.rule"
                  control={control}
                  render={({ field }) => (
                    <select
                      className="select select-bordered select-sm w-[100px] bg-white font-bold text-blue-600"
                      {...field}
                    >
                      <option value={PathwayCompletionRule.All}>ALL</option>
                      <option value={PathwayCompletionRule.Any}>ANY ONE</option>
                    </select>
                  )}
                />{" "}
                of these {stepFields.length} steps{" "}
                <Controller
                  name="pathway.rule"
                  control={control}
                  render={({ field }) =>
                    field.value === PathwayCompletionRule.All ? (
                      <>
                        in{" "}
                        <Controller
                          name="pathway.orderMode"
                          control={control}
                          render={({ field: orderField }) => (
                            <select
                              className="select select-bordered select-sm w-[140px] bg-white font-bold text-blue-600"
                              {...orderField}
                              value={orderField.value ?? ""}
                            >
                              <option value={PathwayOrderMode.Sequential}>
                                ORDER
                              </option>
                              <option value={PathwayOrderMode.AnyOrder}>
                                ANY ORDER
                              </option>
                            </select>
                          )}
                        />
                      </>
                    ) : (
                      <></>
                    )
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  appendStep({
                    name: "",
                    description: null,
                    rule: PathwayCompletionRule.All,
                    orderMode: PathwayOrderMode.Sequential,
                    tasks: [],
                  });
                }}
                className="btn btn-xs tooltip bg-blue-500 text-white"
                data-tip="Add Step"
              >
                <IoMdAdd className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-xs font-bold text-blue-600">
                  ✓
                </span>
                Complete this step
              </div>
              <button
                type="button"
                onClick={() => {
                  appendStep({
                    name: "",
                    description: null,
                    rule: PathwayCompletionRule.All,
                    orderMode: PathwayOrderMode.Sequential,
                    tasks: [],
                  });
                }}
                className="btn btn-xs tooltip bg-blue-500 text-white"
                data-tip="Add Step"
              >
                <IoMdAdd className="h-4 w-4" />
              </button>
            </div>
          )}

          <Controller
            name="pathway.orderMode"
            control={control}
            render={({ field: pathwayOrderField }) => (
              <Controller
                name="pathway.rule"
                control={control}
                render={({ field: pathwayRuleField }) => (
                  <>
                    {stepFields.map((step, displayIndex) => {
                      const stepField = step as any;

                      return (
                        <StepEditComponent
                          key={stepField.id}
                          control={control}
                          stepIndex={displayIndex}
                          displayIndex={displayIndex}
                          pathwayRule={pathwayRuleField.value}
                          pathwayOrderMode={pathwayOrderField.value}
                          onRemove={() => removeStep(displayIndex)}
                          onMoveUp={() => handleMoveStepUp(displayIndex)}
                          onMoveDown={() => handleMoveStepDown(displayIndex)}
                          isFirst={displayIndex === 0}
                          isLast={displayIndex === stepFields.length - 1}
                          showDivider={displayIndex < stepFields.length - 1}
                          errors={errors}
                          opportunityDataMap={opportunityDataMap}
                        />
                      );
                    })}
                  </>
                )}
              />
            )}
          />
        </div>
      )}

      {/* Display steps-level validation errors */}
      {(() => {
        const pathwayErrors = errors?.pathway as any;
        const stepsError = pathwayErrors?.steps;

        // Check for root-level error message
        if (stepsError?.root?.message) {
          return <FormError label={stepsError.root.message as string} />;
        }

        // Fallback to direct message
        if (
          stepsError &&
          typeof stepsError === "object" &&
          "message" in stepsError
        ) {
          return <FormError label={stepsError.message as string} />;
        }
        return null;
      })()}
    </div>
  );
};

// Separate component for each step
interface StepEditComponentProps {
  control: Control<any>;
  stepIndex: number;
  displayIndex: number;
  pathwayRule: string | null;
  pathwayOrderMode: string | null;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  showDivider: boolean;
  errors: any;
  opportunityDataMap?: Record<string, Opportunity>;
}

const StepEditComponent: React.FC<StepEditComponentProps> = ({
  control,
  stepIndex,
  displayIndex,
  pathwayRule,
  pathwayOrderMode,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  showDivider,
  errors,
  opportunityDataMap,
}) => {
  const {
    fields: taskFields,
    append: appendTask,
    remove: removeTask,
    move: moveTask,
  } = useFieldArray({
    control,
    name: `pathway.steps.${stepIndex}.tasks`,
  });

  // Extract opportunities from taskFields for the dropdown
  const opportunitiesFromTasks = useMemo(() => {
    const tasks = taskFields as any[];
    const opportunities: OpportunityInfo[] = [];

    tasks.forEach((task) => {
      // Check task.opportunity first (from loaded data)
      if (task.opportunity && task.opportunity.id) {
        opportunities.push({
          id: task.opportunity.id,
          title: task.opportunity.title,
        } as OpportunityInfo);
      }
      // Then check entityId with opportunityDataMap (from page-level fetch)
      else if (task.entityId && opportunityDataMap?.[task.entityId]) {
        const opp = opportunityDataMap[task.entityId];
        if (opp) {
          opportunities.push({
            id: opp.id,
            title: opp.title,
          } as OpportunityInfo);
        }
      }
    });

    return opportunities;
  }, [taskFields, opportunityDataMap]);

  // Cache for opportunities (starts with opportunities from tasks)
  const [dataOpportunities, setDataOpportunities] = useState<OpportunityInfo[]>(
    opportunitiesFromTasks,
  );

  // Update cache when opportunitiesFromTasks changes
  useEffect(() => {
    if (opportunitiesFromTasks.length > 0) {
      setDataOpportunities((prev) => {
        const newOpps = opportunitiesFromTasks.filter(
          (opp) => !prev.some((x) => x.id === opp.id),
        );
        return newOpps.length > 0 ? [...prev, ...newOpps] : prev;
      });
    }
  }, [opportunitiesFromTasks]);

  const handleMoveTaskUp = (index: number) => {
    if (index > 0) {
      moveTask(index, index - 1);
    }
  };

  const handleMoveTaskDown = (index: number) => {
    if (index < taskFields.length - 1) {
      moveTask(index, index + 1);
    }
  };

  // Load opportunities asynchronously
  const loadOpportunities = useCallback(
    (inputValue: string, callback: (options: any) => void) => {
      debounce(() => {
        searchCriteriaOpportunities({
          opportunities: [],
          organizations: null,
          countries: null,
          titleContains: (inputValue ?? []).length > 2 ? inputValue : null,
          published: true,
          verificationMethod: null,
          verificationEnabled: true,
          pageNumber: 1,
          pageSize: PAGE_SIZE_MEDIUM,
        }).then((data) => {
          const options = data.items.map((item) => ({
            value: item.id,
            label: item.title,
          }));
          callback(options);
          // Add to cache
          data.items.forEach((item) => {
            if (!dataOpportunities.some((x) => x.id === item.id)) {
              setDataOpportunities((prev) => [...prev, item]);
            }
          });
        });
      }, 1000)();
    },
    [dataOpportunities],
  );

  return (
    <div className="space-y-3">
      {/* Step Header - Editable */}
      <div className="flex items-start gap-4">
        {/* Step Number Badge */}
        <div className="mt-2 flex-shrink-0">
          {pathwayRule !== PathwayCompletionRule.Any &&
          pathwayOrderMode === PathwayOrderMode.Sequential ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
              {displayIndex + 1}
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-lg font-bold text-blue-600">
              ?
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          {/* Step Name */}
          <Controller
            name={`pathway.steps.${stepIndex}.name`}
            control={control}
            rules={{ required: "Step name is required" }}
            render={({ field, fieldState }) => (
              <FormField
                showWarningIcon={!!fieldState.error}
                showError={!!fieldState.isTouched && !!fieldState.error}
                error={fieldState.error?.message}
              >
                <FormInput
                  inputProps={{
                    type: "text",
                    placeholder: "Step name...",
                    className: "input",
                    ...field,
                  }}
                />
              </FormField>
            )}
          />

          {/* Step Description */}
          <Controller
            name={`pathway.steps.${stepIndex}.description`}
            control={control}
            render={({ field }) => (
              <textarea
                placeholder="Step description (optional)..."
                className="textarea textarea-bordered w-full text-sm"
                rows={2}
                {...field}
                value={field.value ?? ""}
              />
            )}
          />

          {/* Step Action Buttons */}
          <div className="justify-endx flex gap-2">
            <button
              type="button"
              onClick={onMoveUp}
              className="btn btn-xs tooltip"
              data-tip="Move Step Up"
              disabled={isFirst}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              className="btn btn-xs tooltip"
              data-tip="Move Step Down"
              disabled={isLast}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="btn btn-error btn-xs tooltip text-white"
              data-tip="Remove Step"
            >
              <IoMdTrash className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mt-6 ml-12 space-y-3">
        {/* Task Instruction Header */}
        {taskFields.length === 0 ? (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 p-3">
            <div className="flex w-full flex-row rounded-lg">
              <IoMdAlert className="text-yellow mr-2 h-6 w-6 flex-none" />
              <span className="content-center text-sm font-medium text-yellow-800">
                No tasks added yet
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                appendTask({
                  entityType: PathwayTaskEntityType.Opportunity,
                  entityId: "",
                  order: null,
                });
              }}
              className="btn btn-success btn-xs tooltip text-white"
              data-tip="Add Task"
            >
              <IoMdAdd className="h-4 w-4" />
            </button>
          </div>
        ) : taskFields.length === 1 ? (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-900">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-400 bg-white text-xs font-bold text-green-600">
                ✓
              </span>
              Complete this task
            </div>
            <button
              type="button"
              onClick={() => {
                appendTask({
                  entityType: PathwayTaskEntityType.Opportunity,
                  entityId: "",
                  order: null,
                });
              }}
              className="btn btn-success btn-xs tooltip text-white"
              data-tip="Add Task"
            >
              <IoMdAdd className="h-4 w-4" />
              {/* Add Task */}
            </button>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-900">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-400 bg-white text-xs font-bold text-green-600">
                ✓
              </span>
              Complete{" "}
              <Controller
                name={`pathway.steps.${stepIndex}.rule`}
                control={control}
                render={({ field }) => (
                  <select
                    className="select select-bordered select-sm w-[100px] bg-white font-bold text-green-600"
                    {...field}
                  >
                    <option value={PathwayCompletionRule.All}>ALL</option>
                    <option value={PathwayCompletionRule.Any}>ANY ONE</option>
                  </select>
                )}
              />{" "}
              of these {taskFields.length} tasks{" "}
              <Controller
                name={`pathway.steps.${stepIndex}.rule`}
                control={control}
                render={({ field }) =>
                  field.value === PathwayCompletionRule.All ? (
                    <>
                      in{" "}
                      <Controller
                        name={`pathway.steps.${stepIndex}.orderMode`}
                        control={control}
                        render={({ field: orderField }) => (
                          <select
                            className="select select-bordered select-sm w-[120px] bg-white font-bold text-green-600"
                            {...orderField}
                            value={orderField.value ?? ""}
                          >
                            <option value={PathwayOrderMode.Sequential}>
                              ORDER
                            </option>
                            <option value={PathwayOrderMode.AnyOrder}>
                              ANY ORDER
                            </option>
                          </select>
                        )}
                      />
                    </>
                  ) : (
                    <></>
                  )
                }
              />
            </div>
            <button
              type="button"
              onClick={() => {
                appendTask({
                  entityType: PathwayTaskEntityType.Opportunity,
                  entityId: "",
                  order: null,
                });
              }}
              className="btn btn-success btn-xs tooltip text-white"
              data-tip="Add Task"
            >
              <IoMdAdd className="h-4 w-4" />
              {/* Add Task */}
            </button>
          </div>
        )}

        {/* Display tasks-level validation errors */}
        {(() => {
          const pathwayErrors = errors?.pathway as any;
          const stepErrors = pathwayErrors?.steps?.[stepIndex];
          const tasksError = stepErrors?.tasks;

          // Check for root-level error message
          if (tasksError?.root?.message) {
            return <FormError label={tasksError.root.message as string} />;
          }

          // Fallback to direct message
          if (
            tasksError &&
            typeof tasksError === "object" &&
            "message" in tasksError
          ) {
            return <FormError label={tasksError.message as string} />;
          }
          return null;
        })()}

        {/* Tasks List */}
        {taskFields.length > 0 && (
          <Controller
            name={`pathway.steps.${stepIndex}.orderMode`}
            control={control}
            render={({ field: stepOrderField }) => (
              <Controller
                name={`pathway.steps.${stepIndex}.rule`}
                control={control}
                render={({ field: stepRuleField }) => (
                  <div className="space-y-0">
                    {taskFields.map((taskField: any, taskIndex) => {
                      return (
                        <div key={taskField.id}>
                          <div className="flex gap-3">
                            {/* Task Number/Bullet */}
                            <div className="mt-2 flex-shrink-0">
                              {stepRuleField.value !==
                                PathwayCompletionRule.Any &&
                              stepOrderField.value ===
                                PathwayOrderMode.Sequential ? (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 bg-white font-semibold text-green-600">
                                  {taskIndex + 1}
                                </div>
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 bg-white text-lg font-bold text-green-600">
                                  ?
                                </div>
                              )}
                            </div>

                            {/* Task Content */}
                            <div className="mb-4 min-w-0 flex-1 space-y-2">
                              {/* Opportunity Selector */}
                              <Controller
                                name={`pathway.steps.${stepIndex}.tasks.${taskIndex}.entityId`}
                                control={control}
                                rules={{
                                  required: "Opportunity is required",
                                }}
                                render={({
                                  field: { onChange, value },
                                  fieldState,
                                }) => {
                                  // Get the full task to access opportunity data
                                  const task = taskFields[taskIndex] as any;

                                  // Determine the actual ID to use
                                  const actualId =
                                    value || task?.opportunity?.id;

                                  // Find the label from cache
                                  const opportunity = dataOpportunities.find(
                                    (c) => c.id === actualId,
                                  );

                                  return (
                                    <FormField
                                      //label="Select Opportunity"
                                      //showWarningIcon={!!fieldState.error}
                                      showError={!!fieldState.error}
                                      error={fieldState.error?.message}
                                    >
                                      <Async
                                        instanceId={`opportunity-${stepIndex}-${taskIndex}`}
                                        classNames={{
                                          control: () =>
                                            "input input-sm text-[1rem] h-fit !border-gray",
                                        }}
                                        isMulti={false}
                                        defaultOptions={true}
                                        cacheOptions
                                        loadOptions={loadOpportunities}
                                        onChange={(val: any) => {
                                          onChange(val?.value ?? "");
                                        }}
                                        value={
                                          actualId && opportunity
                                            ? {
                                                value: opportunity.id,
                                                label: opportunity.title,
                                              }
                                            : actualId
                                              ? {
                                                  value: actualId,
                                                  label: actualId,
                                                }
                                              : null
                                        }
                                        placeholder="Select opportunity..."
                                        isClearable={true}
                                      />
                                    </FormField>
                                  );
                                }}
                              />

                              {/* Show selected opportunity preview */}
                              <Controller
                                name={`pathway.steps.${stepIndex}.tasks.${taskIndex}.entityId`}
                                control={control}
                                render={({ field }) => (
                                  <>
                                    {field.value && (
                                      <div className="rounded border border-gray-200 bg-white p-3">
                                        <PathwayTaskOpportunity
                                          opportunityId={field.value}
                                          opportunity={
                                            opportunityDataMap?.[field.value]
                                          }
                                          isAdmin={true}
                                        />
                                      </div>
                                    )}
                                  </>
                                )}
                              />

                              {/* Task Action Buttons */}
                              <div className="justify-endx flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleMoveTaskUp(taskIndex)}
                                  className="btn btn-xs tooltip"
                                  data-tip="Move Task Up"
                                  disabled={taskIndex === 0}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTaskDown(taskIndex)}
                                  className="btn btn-xs tooltip"
                                  data-tip="Move Task Down"
                                  disabled={taskIndex === taskFields.length - 1}
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeTask(taskIndex)}
                                  className="btn btn-error btn-xs tooltip text-white"
                                  data-tip="Remove Task"
                                >
                                  <IoMdTrash className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* AND/OR indicator between tasks */}
                          {taskIndex < taskFields.length - 1 && (
                            <div className="mb-4 flex justify-center">
                              <div className="badge badge-sm border-green-400 bg-green-400 px-3 py-2 font-bold text-white">
                                {stepRuleField.value ===
                                PathwayCompletionRule.Any
                                  ? "OR"
                                  : stepOrderField.value ===
                                      PathwayOrderMode.Sequential
                                    ? "THEN"
                                    : "AND"}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              />
            )}
          />
        )}
      </div>

      {/* Divider between steps */}
      {showDivider && (
        <div className="my-4 flex items-center gap-3">
          {pathwayRule !== PathwayCompletionRule.Any &&
          pathwayOrderMode === PathwayOrderMode.Sequential ? (
            <>
              <div className="h-0.5 flex-1 bg-gray-200" />
              <span className="text-sm font-semibold text-blue-600">THEN</span>
              <div className="h-0.5 flex-1 bg-gray-200" />
            </>
          ) : (
            <>
              <div className="h-0.5 flex-1 bg-gray-200" />
              <span className="text-sm font-semibold text-blue-600">
                {pathwayRule === PathwayCompletionRule.Any ? "OR" : "AND"}
              </span>
              <div className="h-0.5 flex-1 bg-gray-200" />
            </>
          )}
        </div>
      )}
    </div>
  );
};
