import { LookmlModelExploreFieldEnumeration } from './lookml_model_explore_field_enumeration';
import { LookmlModelExploreFieldMapLayer } from './lookml_model_explore_field_map_layer';
import { LookmlModelExploreFieldMeasureFilters } from './lookml_model_explore_field_measure_filters';
import { LookmlModelExploreFieldSqlCase } from './lookml_model_explore_field_sql_case';
import { LookmlModelExploreFieldTimeInterval } from './lookml_model_explore_field_time_interval';
export declare enum LookmlModelExploreFieldAlign {
    Left = "left",
    Right = "right"
}
export declare enum LookmlModelExploreFieldCategory {
    Parameter = "parameter",
    Filter = "filter",
    Measure = "measure",
    Dimension = "dimension"
}
export declare enum LookmlModelExploreFieldFillStyle {
    Enumeration = "enumeration",
    Range = "range"
}
export declare enum LookmlModelExploreFieldUserAttributeFilterTypes {
    AdvancedFilterString = "advanced_filter_string",
    AdvancedFilterNumber = "advanced_filter_number",
    AdvancedFilterDatetime = "advanced_filter_datetime",
    String = "string",
    Number = "number",
    Datetime = "datetime",
    RelativeUrl = "relative_url",
    Yesno = "yesno",
    Zipcode = "zipcode"
}
export declare enum LookmlModelExploreFieldWeekStartDay {
    Monday = "monday",
    Tuesday = "tuesday",
    Wednesday = "wednesday",
    Thursday = "thursday",
    Friday = "friday",
    Saturday = "saturday",
    Sunday = "sunday"
}
export interface LookmlModelExploreField {
    /** The appropriate horizontal text alignment the values of this field should be displayed in. Valid values are: "left", "right". */
    align: LookmlModelExploreFieldAlign;
    /** Whether it's possible to filter on this field. */
    can_filter: boolean;
    /** Field category Valid values are: "parameter", "filter", "measure", "dimension". */
    category: LookmlModelExploreFieldCategory | null;
    /** The default value that this field uses when filtering. Null if there is no default value. */
    default_filter_value: string | null;
    /** Description */
    description: string | null;
    /** An array enumerating all the possible values that this field can contain. When null, there is no limit to the set of possible values this field can contain. */
    enumerations: LookmlModelExploreFieldEnumeration[] | null;
    /** An error message indicating a problem with the definition of this field. If there are no errors, this will be null. */
    error: string | null;
    /** A label creating a grouping of fields. All fields with this label should be presented together when displayed in a UI. */
    field_group_label: string | null;
    /** When presented in a field group via field_group_label, a shorter name of the field to be displayed in that context. */
    field_group_variant: string | null;
    /** The style of dimension fill that is possible for this field. Null if no dimension fill is possible. Valid values are: "enumeration", "range". */
    fill_style: LookmlModelExploreFieldFillStyle | null;
    /** An offset (in months) from the calendar start month to the fiscal start month defined in the LookML model this field belongs to. */
    fiscal_month_offset: number;
    /** Whether this field has a set of allowed_values specified in LookML. */
    has_allowed_values: boolean;
    /** Whether this field should be hidden from the user interface. */
    hidden: boolean;
    /** Whether this field is a filter. */
    is_filter: boolean;
    /** Whether this field represents a fiscal time value. */
    is_fiscal: boolean;
    /** Whether this field is of a type that represents a numeric value. */
    is_numeric: boolean;
    /** Whether this field is of a type that represents a time value. */
    is_timeframe: boolean;
    /** (Undocumented, internal-only) Whether this field is a turtle! */
    is_turtle: boolean;
    /** (Undocumented, internal-only) Whether this field can actually be turtled! */
    can_turtle: boolean;
    /** (Undocumented, internal-only) Turtle dimension */
    turtle_dimension: LookmlModelExploreField | null;
    /** Whether this field can be time filtered. */
    can_time_filter: boolean;
    /** Details on the time interval this field represents, if it is_timeframe. */
    time_interval: LookmlModelExploreFieldTimeInterval | null;
    /** Fully-qualified human-readable label of the field. */
    label: string;
    /** The name of the parameter that will provide a parameterized label for this field, if available in the current context. */
    label_from_parameter: string | null;
    /** The human-readable label of the field, without the view label. */
    label_short: string;
    /** A URL linking to the definition of this field in the LookML IDE. */
    lookml_link: string | null;
    /** If applicable, a map layer this field is associated with. */
    map_layer: LookmlModelExploreFieldMapLayer | null;
    /** Whether this field is a measure. */
    measure: boolean;
    /** Fully-qualified name of the field. */
    name: string;
    /** If yes, the field will not be localized with the user attribute number_format. Defaults to no */
    strict_value_format: boolean;
    /** Whether this field is a parameter. */
    parameter: boolean;
    /** Whether this field can be removed from a query. */
    permanent: boolean | null;
    /** Whether or not the field represents a primary key. */
    primary_key: boolean;
    /** The name of the project this field is defined in. */
    project_name: string | null;
    /** When true, it's not possible to re-sort this field's values without re-running the SQL query, due to database logic that affects the sort. */
    requires_refresh_on_sort: boolean;
    /** The LookML scope this field belongs to. The scope is typically the field's view. */
    scope: string;
    /** Whether this field can be sorted. */
    sortable: boolean;
    /** The path portion of source_file_path. */
    source_file: string;
    /** The fully-qualified path of the project file this field is defined in. */
    source_file_path: string;
    /** SQL expression as defined in the LookML model. The SQL syntax shown here is a representation intended for auditability, and is not neccessarily an exact match for what will ultimately be run in the database. It may contain special LookML syntax or annotations that are not valid SQL. This will be null if the current user does not have the see_lookml permission for the field's model. */
    sql: string | null;
    /** An array of conditions and values that make up a SQL Case expression, as defined in the LookML model. The SQL syntax shown here is a representation intended for auditability, and is not neccessarily an exact match for what will ultimately be run in the database. It may contain special LookML syntax or annotations that are not valid SQL. This will be null if the current user does not have the see_lookml permission for the field's model. */
    sql_case: LookmlModelExploreFieldSqlCase[] | null;
    /** Array of filter conditions defined for the measure in LookML. */
    filters: LookmlModelExploreFieldMeasureFilters[] | null;
    /** The name of the dimension to base suggest queries from. */
    suggest_dimension: string;
    /** The name of the explore to base suggest queries from. */
    suggest_explore: string;
    /** Whether or not suggestions are possible for this field. */
    suggestable: boolean;
    /** If available, a list of suggestions for this field. For most fields, a suggest query is a more appropriate way to get an up-to-date list of suggestions. Or use enumerations to list all the possible values. */
    suggestions: string[] | null;
    /** An array of arbitrary string tags provided in the model for this field. */
    tags: string[];
    /** The LookML type of the field. */
    type: string;
    /** An array of user attribute types that are allowed to be used in filters on this field. Valid values are: "advanced_filter_string", "advanced_filter_number", "advanced_filter_datetime", "string", "number", "datetime", "relative_url", "yesno", "zipcode". */
    user_attribute_filter_types: LookmlModelExploreFieldUserAttributeFilterTypes[];
    /** If specified, the LookML value format string for formatting values of this field. */
    value_format: string | null;
    /** The name of the view this field belongs to. */
    view: string;
    /** The human-readable label of the view the field belongs to. */
    view_label: string;
    /** Whether this field was specified in "dynamic_fields" and is not part of the model. */
    dynamic: boolean;
    /** The name of the starting day of the week. Valid values are: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday". */
    week_start_day: LookmlModelExploreFieldWeekStartDay;
}
export interface RequestLookmlModelExploreField {
}
