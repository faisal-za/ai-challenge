/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/**
 * (0) Real:                                An index info from a linearization entity <br />
 * (1) UnderShoreLine:                      An index entity from an entity under the shoreline<br />
 * (2) UnderShoreLineLogicallyDefined:      An index entity from an entity under the shoreline
 *                                                        and has a logical definition<br />
 * (3) PostCoordinationCombination:         Virtual index entity created by following post-coordination
 *                                                        combinations
 * @format int32
 */
export enum PropertyValueTypeEnum {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
}

/** @format int32 */
export enum PostcoordinationAvailabilityEnum {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
}

/** @format int32 */
export enum MatchLevelEnum {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
}

/** @format int32 */
export enum GuessTypeEnum {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
}

/**
 * (0) Real: real entity in the linearization / foundation <br />
 * (1) UnderShoreLineLogicallyDefined: Entity in the foundation that can be represented as a post-coordination combination in the linearization <br />
 * (2) PostCoordinationCombination: does not exist in the foundation but can be represented as post-coordination combination
 * @format int32
 */
export enum EntityTypeEnum {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
}

/** Response object for autocode endpoint */
export interface AutoCodingSearchResult {
  /** Text that is searched */
  searchText?: string | null;
  /** The best matching phrase found in the classification */
  matchingText?: string | null;
  /** Code of the best matching entity found in the classification */
  theCode?: string | null;
  /** Foundation URI of the best matching entity found in the classification */
  foundationURI?: string | null;
  /** Linearization URI of the best matching entity found in the classification */
  linearizationURI?: string | null;
  matchLevel?: MatchLevelEnum;
  /**
   * Shows the score of the match. The score is a value between 0 and 1. The higher the score the better the match.
   * @format double
   */
  matchScore?: number;
  /**
   * (0) Real:                                An index info from a linearization entity <br />
   * (1) UnderShoreLine:                      An index entity from an entity under the shoreline<br />
   * (2) UnderShoreLineLogicallyDefined:      An index entity from an entity under the shoreline
   *                                                        and has a logical definition<br />
   * (3) PostCoordinationCombination:         Virtual index entity created by following post-coordination
   *                                                        combinations
   */
  matchType?: PropertyValueTypeEnum;
}

/**
 * This class is used when an ICD-11 linearization queried with a code or a postcoordination code cluster
 * It provides information on the entities referred in the code string
 */
export interface CodeInfo {
  /** Code as it is queried */
  code?: string | null;
  /** Code of the stem. i.e. the first code that is postcoordinated */
  stemCode?: string | null;
  /** Id of the stem. */
  stemId?: string | null;
  /**
   * In some cases the requested postcoordination combination may be simplified. In these cases, the simplifiedCode field contains
   * the code after simplification.
   */
  simplifiedCode?: string | null;
  /**
   * In some cases the requested postcoordination combination may be simplified. In these cases, the simplifiedStemCode field contains
   * the stem code after simplification.
   */
  simplifiedStemCode?: string | null;
  activityWhenInjured?: string[] | null;
  alcoholUseInInjury?: string[] | null;
  aspectsOfArmedConflict?: string[] | null;
  aspectsOfAssaultAndMaltreatment?: string[] | null;
  aspectsOfIntentionalSelfHarm?: string[] | null;
  associatedWith?: string[] | null;
  causality?: string[] | null;
  chemicalAgent?: string[] | null;
  contextOfAssaultAndMaltreatment?: string[] | null;
  counterpart?: string[] | null;
  course?: string[] | null;
  diagnosisConfirmedBy?: string[] | null;
  distribution?: string[] | null;
  durationOfComa?: string[] | null;
  extentOfBurnByBodySurface?: string[] | null;
  extentOfFullThicknessBurnByBodySurface?: string[] | null;
  fractureOpenOrClosed?: string[] | null;
  fractureSubtype?: string[] | null;
  genderOfPerpetrator?: string[] | null;
  genomicAndChomosomalAnomaly?: string[] | null;
  hasAction?: string[] | null;
  hasCausingCondition?: string[] | null;
  hasGCSEyeScore?: string[] | null;
  hasGCSMotorScore?: string[] | null;
  hasGCSVerbalScore?: string[] | null;
  hasManifestation?: string[] | null;
  hasMeans?: string[] | null;
  hasPupilReactionScore?: string[] | null;
  hasSeverity?: string[] | null;
  hasAlternativeSeverity1?: string[] | null;
  hasAlternativeSeverity2?: string[] | null;
  hasTarget?: string[] | null;
  histopathology?: string[] | null;
  infectiousAgent?: string[] | null;
  jointInvolvementInFracture?: string[] | null;
  laterality?: string[] | null;
  mechanismOfInjury?: string[] | null;
  mechanismOfTransportInjuryWithoutCounterpart?: string[] | null;
  medication?: string[] | null;
  modeOfTransportOfTheInjuredPerson?: string[] | null;
  objectOrSubstanceProducingInjury?: string[] | null;
  occupationalDescriptor?: string[] | null;
  outcomeOfFullThicknessBurn?: string[] | null;
  perpetratorVictimRelationship?: string[] | null;
  placeOfOccurrence?: string[] | null;
  psychoactiveDrugUseInInjury?: string[] | null;
  regional?: string[] | null;
  relational?: string[] | null;
  roleOfInjuredPersonInArmedConflict?: string[] | null;
  roleOfTheInjuredPerson?: string[] | null;
  serotype?: string[] | null;
  specificAnatomy?: string[] | null;
  sportsActivityDescriptor?: string[] | null;
  temporalPatternAndOnset?: string[] | null;
  timeInLife?: string[] | null;
  transportEventDescriptor?: string[] | null;
  typeOfArmedConflict?: string[] | null;
  typeOfInjury?: string[] | null;
  typeOfLegalIntervention?: string[] | null;
  barrierOrFacilitator?: string[] | null;
  capacity?: string[] | null;
  performance?: string[] | null;
  extentOrMagnitudeOfImpairment?: string[] | null;
  natureOrChangeInBodyStructure?: string[] | null;
}

/** Class representing a foundation entity */
export interface FoundationEntity {
  /** Language specific text as used in JSON-LD */
  title?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  definition?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  longDefinition?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  fullySpecifiedName?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  diagnosticCriteria?: LanguageSpecificText;
  /** List of URIs for the child entities */
  child?: string[] | null;
  /** List of URIs for the parent entities */
  parent?: string[] | null;
  /** List of ancestors. Provided only with include=ancestor */
  ancestor?: string[] | null;
  /** List of descendants. Provided only with include=descendant */
  descendant?: string[] | null;
  /** List of synonyms for this entity */
  synonym?: Term[] | null;
  /** List of narrower terms for this entity */
  narrowerTerm?: Term[] | null;
  /** List of inclusions for this entity */
  inclusion?: Term[] | null;
  /** List of exclusions for this entity */
  exclusion?: Term[] | null;
  /**
   * ICD Browser is a web site that allows users see the ICD in its hierarchical structure at the same time providing search and post-coordination features.
   * Browser URL property provides a direct link to the classification in the WHO's on-line ICD Browser.
   */
  browserUrl?: string | null;
}

/** Represents a keyword returned as a as a word completion suggestion or as a next word suggestion */
export interface GuessWord {
  label?: string | null;
  dontChangeResult?: boolean;
}

/** Class representing an ICD-10 Entity */
export interface ICD10Entity {
  /** Language specific text as used in JSON-LD */
  title?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  definition?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  longDefinition?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  fullySpecifiedName?: LanguageSpecificText;
  /** URI of the foundation entity that this entity is derived from */
  source?: string | null;
  /** Code for the ICD-11 category */
  code?: string | null;
  /** Language specific text as used in JSON-LD */
  note?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  codingHint?: LanguageSpecificText;
  /**
   * Class kind for the category. It could be one of the following
   * - chapter : if the entity is a chapter. (i.e. at the top level of the classification
   * - block : huger level entity which don't have codes
   * - category : An ICD entity that bears a code
   */
  classKind?: string | null;
  /** List of URIs for the child entities */
  child?: string[] | null;
  /** List of URIs for the parent entity */
  parent?: string | null;
  /**
   * ICD-11 Index terms are generated from the terms (titles, inclusions, narrower terms) included in the entity
   * as well as from the foundation entities under the linearization shore line. The IndexTerm property includes
   * all of the index terms of a linearization entity in one place.
   */
  indexTerm?: Term[] | null;
  /** List of inclusions for this entity */
  inclusion?: Term[] | null;
  /** List of exclusions for this entity */
  exclusion?: Term[] | null;
  /**
   * ICD Browser is a web site that allows users see the ICD in its hierarchical structure at the same time providing search and post-coordination features.
   * Browser URL property provides a direct link to the classification in the WHO's on-line ICD Browser.
   */
  browserUrl?: string | null;
}

/** Represents the search result. The search result is organized by ICD entities and in each entity we provide matching property values */
export interface ISearchResult {
  /** List of entities that match the search query */
  destinationEntities?: ISimpleEntity[] | null;
  /** Returns true if an error is occurred during the search */
  error?: boolean;
  /** Error message if there was an error */
  errorMessage?: string | null;
  /** If the search matches too many results, then the result is chopped */
  resultChopped?: boolean;
  /** Shows if the word suggestion list is chopped as a result of too many matching words. */
  wordSuggestionsChopped?: boolean;
  guessType?: GuessTypeEnum;
  /** @format uuid */
  uniqueSearchId?: string;
  /** List of word suggestions if the search had includeKeywordResult parameter set to true */
  words?: GuessWord[] | null;
}

/** SimpleEntity class represents a single ICD Entity in a search result */
export interface ISimpleEntity {
  /** URI of the Entity */
  id?: string | null;
  /**
   * Title of the Entity. The matched part of the title has a special markup for highlighting.
   * For example when searched for the cholera the title Vibrio cholera will be like Vibrio <em class="found">cholera</em>
   */
  title?: string | null;
  /**
   * If the search result is composed of multiple URIs (i.e. postcoordinated result), Stem Id contains the URI of the stem code
   * This field contains the same information as Id in foundation search results
   */
  stemId?: string | null;
  /** Shows whether the entity is a leaf node (i.e. does not have any children) */
  isLeaf?: boolean;
  postcoordinationAvailability?: PostcoordinationAvailabilityEnum;
  /** Shows whether there is a coding note attached to the item */
  hasCodingNote?: boolean;
  /** Shows whether the entity has maternal chapter link */
  hasMaternalChapterLink?: boolean;
  hasPerinatalChapterLink?: boolean;
  /** List of property values that match the search string */
  matchingPVs?: ISimplePropertyValue[] | null;
  /** Shows if the list of matching property values is truncated as a result of too many maching property values */
  propertiesTruncated?: boolean;
  /** Shows if this entity is an other specified residual category. (Not applicable for foundation search ) */
  isResidualOther?: boolean;
  /** Shows if this entity is an unspecified residual category. (Not applicable for foundation search ) */
  isResidualUnspecified?: boolean;
  /** The chapter code for the entity */
  chapter?: string | null;
  /** The code for the entity (Not applicable for foundation ) */
  theCode?: string | null;
  /**
   * Shows how good is the search result. Higher numbers are better matches. There is no other meaning to this value than its relative value
   * @format double
   */
  score?: number;
  /** Shows whether the title of the entity is among the search results */
  titleIsASearchResult?: boolean;
  /** Shows whether the title is the top scored search result */
  titleIsTopScore?: boolean;
  /**
   * (0) Real: real entity in the linearization / foundation <br />
   * (1) UnderShoreLineLogicallyDefined: Entity in the foundation that can be represented as a post-coordination combination in the linearization <br />
   * (2) PostCoordinationCombination: does not exist in the foundation but can be represented as post-coordination combination
   */
  entityType?: EntityTypeEnum;
  /** Identifies a very good match. The result matches all words from the search query. */
  important?: boolean;
  /** Used when the search result is not represented as flat list but rather organized according to ICD hierarchy */
  descendants?: ISimpleEntity[] | null;
}

/** Represents PropertyValues returned in the search result */
export interface ISimplePropertyValue {
  /** Id of the property */
  propertyId?: string | null;
  /**
   * Label that matches the search query. The matched part of the label has a special markup for highlighting.
   * For example when searched for the cholera the Vibrio cholera will be like Vibrio <em class="found">cholera</em>
   */
  label?: string | null;
  /**
   * Score of the match for this particular property value
   * @format double
   */
  score?: number;
  /** Identifies a very good match. The result matches all words from the search query. */
  important?: boolean;
  /**
   * Only used when searching a linearization
   * The foundation URI in which the property value is located.
   * This is filled in only during a linearization search when this property value is coming from an under shoreline entity.
   */
  foundationUri?: string | null;
  /**
   * (0) Real:                                An index info from a linearization entity <br />
   * (1) UnderShoreLine:                      An index entity from an entity under the shoreline<br />
   * (2) UnderShoreLineLogicallyDefined:      An index entity from an entity under the shoreline
   *                                                        and has a logical definition<br />
   * (3) PostCoordinationCombination:         Virtual index entity created by following post-coordination
   *                                                        combinations
   */
  propertyValueType?: PropertyValueTypeEnum;
}

/** Language specific text as used in JSON-LD */
export interface LanguageSpecificText {
  /** Language code for the string */
  "@language"?: string | null;
  /** Label in the given language */
  "@value"?: string | null;
}

/** Class representing a linearization entity such as a category in the MMS. */
export interface LinearizationEntity {
  /** JSON-LD Context for the endpoint */
  "@context"?: string | null;
  /** unique id for this linearization entity (URI) */
  "@id"?: string | null;
  /** Language specific text as used in JSON-LD */
  title?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  definition?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  longDefinition?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  fullySpecifiedName?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  diagnosticCriteria?: LanguageSpecificText;
  /** URI of the foundation entity that this entity is derived from */
  source?: string | null;
  /** Code for the ICD-11 category */
  code?: string | null;
  /** Language specific text as used in JSON-LD */
  codingNote?: LanguageSpecificText;
  /** Block id for the block (only applicable to the blocks (groupings). e.g. BlockL2-1A0 */
  blockId?: string | null;
  /** Code range for the block (only applicable to the blocks (groupings) e.g. 1A00-1A0Z */
  codeRange?: string | null;
  /**
   * Class kind for the category. It could be one of the following
   * - chapter : if the entity is a chapter. (i.e. at the top level of the classification
   * - block : higher level entity which don't have codes
   * - category : An ICD entity that bears a code
   * - window : A special type of grouping which don;t have children underneath but just foundationChildElsewhere
   */
  classKind?: string | null;
  /** List of URIs for the child entities */
  child?: string[] | null;
  /** List of URIs for the parent entity */
  parent?: string[] | null;
  /** List of ancestors. Provided only with include=ancestor */
  ancestor?: string[] | null;
  /** List of descendants. Provided only with include=descendant */
  descendant?: string[] | null;
  /**
   * ICD-11 Foundation allows multiple parenting which means a category could be located in more than place in
   * the foundation component. However, this is not possible for ICD-11 linearizations such as in ICD-11 MMS
   * in which a category must be located at a single location. When looking at a linearization entity, this
   * property would list the foundation children that are not children in the linearization.
   */
  foundationChildElsewhere?: Term[] | null;
  /**
   * ICD-11 Index terms are generated from the terms (titles, inclusions, narrower terms) included in the entity
   * as well as from the foundation entities under the linearization shore line. The IndexTerm property includes
   * all of the index terms of a linearization entity in one place.
   */
  indexTerm?: Term[] | null;
  /** List of inclusions for this entity */
  inclusion?: Term[] | null;
  /** List of exclusions for this entity */
  exclusion?: Term[] | null;
  /** Related entities from the maternal chapter (J) */
  relatedEntitiesInMaternalChapter?: string[] | null;
  /** Related entities from the perinatal chapter (K) */
  relatedEntitiesInPerinatalChapter?: string[] | null;
  /**
   * Contains information on which axes allows or requires postcoordination for an entity
   * together with the value set that could be used for the postcoordination
   */
  postcoordinationScale?: PostcoordinationScaleInfo[] | null;
  /**
   * ICD Browser is a web site that allows users see the ICD in its hierarchical structure at the same time providing search and post-coordination features.
   * Browser URL property provides a direct link to the classification in the WHO's on-line ICD Browser.
   */
  browserUrl?: string | null;
}

/**
 * Class representing available versions of a given classification or classification entity
 * This is used when the request is made without a relase id (or minor version)
 */
export interface MultiVersion {
  /** Language specific text as used in JSON-LD */
  title?: LanguageSpecificText;
  /** Latest release available for this linearization */
  latestRelease?: string | null;
  /** List of available releases for this linearization */
  release?: string[] | null;
}

/**
 * This class contains information on which axes allow or require postcoordination for an entity
 * together with the valueset that could be used for the postcoordination
 */
export interface PostcoordinationScaleInfo {
  /** postcoordination axis name (a URI that uniquely identifies the axis) */
  axisName?: string | null;
  /** If the post-coordination is required or just allowed. "true" means it is a required postcoordination */
  requiredPostcoordination?: string | null;
  /**
   * Shows the behaviour of the postcoordination
   * - 'AllowAlways' means the user could post-coordinate multiple times using this axis.
   * - 'NotAllowed' means the user only post-coordinate once using this axis
   * - 'AllowedExceptFromSameBlock' means multiple values are allowed only if they are coming from different blocks within the value set
   */
  allowMultipleValues?: string | null;
  /**
   * List of allowed values during postcoordination.
   * Note that these are hierarchical starting points of the allowed value set. i.e. any descendant of the entities provided under the
   * `scaleEntity` property can be used during postcoordination.
   */
  scaleEntity?: string[] | null;
}

/** Represents a postcoordination combination. It could be a nested postcoordination where the axis value can also be a postcoordination combination */
export interface PostcoordinationSet {
  /** Full code string for the postcoordination combination */
  code?: string | null;
  /** Full linearization URI string for the postcoordination combination */
  linearizationUri?: string | null;
  /** Full foundation URI string for the postcoordination combination */
  foundationUri?: string | null;
  /** Label representing the postcoordination combination containing the titles of the stem code all postcoordination values inluding nested values */
  label?: string | null;
  /**
   * Code of the stem for the postcoordination combination
   * stemCode is not provided if the postcoordinationset is a plain entity without postcoordination.
   * In that case code can be used instead
   */
  stemCode?: string | null;
  /**
   * Linearization URI string for the stem of the postcoordination combination.
   * StemLinearizationUri is not provided if the postcoordinationset is a plain entity without postcoordination.
   * In that case LinearizationUri can be used instead
   */
  stemLinearizationUri?: string | null;
  /**
   * Foundation URI string for the stem of the postcoordination combination
   * StemFoundationUri is not provided if the postcoordinationset is a plain entity without postcoordination.
   * In that case FoundationUri can be used instead
   */
  stemFoundationUri?: string | null;
  /**
   * Label representing the stem of the postcoordination combination
   * StemLabel is not provided if the postcoordinationset is a plain entity without postcoordination.
   * In that case Label can be used instead
   */
  stemLabel?: string | null;
  /** List of axes and values added to the stem which builds the postcoordination combination */
  postcoordinationValues?: PostcoordinationValue[] | null;
}

/** Represnets a set values with a specified axis. It is used to build postcoordination combinations */
export interface PostcoordinationValue {
  /** Name of the axis */
  axisName?: string | null;
  /** List of values which could be postcoordination combinations themselves */
  values?: PostcoordinationSet[] | null;
}

/** Class representing a term with language specific label and optional cross references */
export interface Term {
  /** Language specific text as used in JSON-LD */
  label?: LanguageSpecificText;
  /**
   * In some cases such as in exclusions or index terms, the term itself could be coming from another entity in the classification
   * In these cases foundationReference holds the foundation URI for that entity
   * Index terms generated from foundation entities that are not located in the linearization have this reference
   */
  foundationReference?: string | null;
  /**
   * In some cases such as in exclusions or index terms, the term itself could be coming from another entity in the classification
   * In these cases linearizationReference holds the linearization (or release) URI for that entity
   */
  linearizationReference?: string | null;
  /** If the term has been deprecated, this flag is set to true */
  deprecated?: boolean;
}

/** Class representing top level foundation or linearization */
export interface TopLevel {
  /** JSON-LD Context for the endpoint */
  "@context"?: string | null;
  /** unique id for the classification */
  "@id"?: string | null;
  /** Language specific text as used in JSON-LD */
  title?: LanguageSpecificText;
  /** Language specific text as used in JSON-LD */
  definition?: LanguageSpecificText;
  /** List of top level entities */
  child?: string[] | null;
  /** Release date */
  releaseDate?: string | null;
  /** Release identifier for this particular release of the classification */
  releaseId?: string | null;
  /**
   * ICD Browser is a web site that allows users see the ICD in its hierarchical structure at the same time providing search and post-coordination features.
   * Browser URL property provides a direct link to the classification in the WHO's on-line ICD Browser.
   */
  browserUrl?: string | null;
}

/** Underlying cause of death response from DORIS system */
export interface UnderlyingCauseOfDeath {
  /** Stem code for the computed underlying cause of death */
  stemCode?: string | null;
  /** URI for the stem code of the computed underlying cause of death */
  stemURI?: string | null;
  /** Code for underlying cause of death. May include postcoordination combinations */
  code?: string | null;
  /** URI for underlying cause of death. May include postcoordination combinations */
  uri?: string | null;
  /** Output report prepared during the computation of the underlying cause of death */
  report?: string | null;
  /** Detailed tabular output report prepared during the computation of the underlying cause of death */
  tabularReport?: string | null;
  /** Whether the underlying cause of death was rejected due to an error */
  reject?: boolean;
  /** Any errors returned by the doris engine */
  error?: string | null;
  /** Any warnings returned by the doris engine */
  warning?: string | null;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title ICD-API
 * @version v2.5.0
 * @license  ICD-11 Terms of Use and License Agreement  (https://icd.who.int/en/docs/icd11-license.pdf)
 *
 *
 * <p>
 * ICD-API is a REST API that allows programmatic access to the International Classification of Diseases (ICD).
 * </p><p>
 * For most users that require accessing the ICD-11 statistical classification with codes, you need to use the <b>Linearization</b> endpoints with the linearizationId set to <b>mms</b>
 * </p><p>
 * <b>Foundation</b> endpoints provide information on the Foundation Component of ICD-11.
 * </p><p>
 * <b>ICD10</b> endpoints serves ICD-10 releases. Please note that functionality on the ICD-10 endpoints are limited. (i.e. the search is not provided)
 * </p><p>
 * For more information on the API please see the <a href="https://icd.who.int/icdapi">ICD-API home page </a>
 * </p>
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  icd = {
    /**
     * No description
     *
     * @tags Foundation
     * @name GetFoundation
     * @summary This endpoint returns basic information on the latest release of the ICD-11 Foundation together with the top level Foundation entities.
     * @request GET:/icd/entity
     * @secure
     */
    getFoundation: (
      query?: {
        /**
         * This is an optional parameter and if ignored, the API will return values from the latest released version of the Foundation.
         *             If provided, the API will respond using that particular release. The values are like 2019-04. All releases are listed at https://icd.who.int/docs/icd-api/SupportedClassifications
         */
        releaseId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<TopLevel, void>({
        path: `/icd/entity`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Foundation
     * @name GetFoundationEntity
     * @summary This endpoint provides you information on a specific ICD-11 foundation entity
     * @request GET:/icd/entity/{id}
     * @secure
     */
    getFoundationEntity: (
      id: string,
      query?: {
        /**
         * This is an optional parameter and if ignored, the API will return values from the latest released version of the Foundation.
         *             If provided, the API will respond using that particular release. The values are like 2019-04. All releases are listed at https://icd.who.int/docs/icd-api/SupportedClassifications
         */
        releaseId?: string;
        /**
         * Some property values such as ancestor and decendant lists are not provided in the response by default. However, it is possible
         *             to request them. These properties are <i>ancestor, descendant and diagnosticCriteria.</i> For example, if you set include=ancestor the returned response will
         *             include all ancestor entity URIs for the requested entity.
         *             A comma separated list could be used to request multiple optional property values. e.g. include=ancestor,descendant
         */
        include?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<FoundationEntity, void>({
        path: `/icd/entity/${id}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Foundation
 * @name SearchFoundation
 * @summary This endpoint is for searching the foundation component of the ICD-11. The search can be customized using the parameters as described. Search endpoint accepts both GET and POST requests. If the size of the request is too large, you may need to use POST
as HTTP GET has a size limit of 2K
 * @request GET:/icd/entity/search
 * @secure
 */
    searchFoundation: (
      query?: {
        /** Text to be searched. Having the character % at the end will be regarded as a wild card for that word */
        q?: string;
        /** Optional parameter. Comma separated list of URIs. If provided, the search will be performed on the entities provided and their descendants */
        subtreesFilter?: string;
        /** Optional, comma or semicolon separated list of chapter codes eg:01;02;21 When provided, the search will be performed only on these chapters */
        chapterFilter?: string;
        /**
         * Changes the search mode to flexible search.
         *             - In the regular search mode, the Coding Tool will only give you results that contain all of the words that you've used in your search. It accepts different variants or
         *             synonyms of the words but essentially it searches for a result that contains all components of your search. Whereas in flexible search mode, the results do not have to
         *             contain all of the words that are typed. It would still try to find the best matching phrase but there may be words in your search that are not matched at all
         *             - It is recommended to use flexible search only when regular search does not provide a result
         * @default false
         */
        useFlexisearch?: boolean;
        /**
         * Optional parameter. Default value false. If set to true the search result entities are provided in a nested data structure
         *             representing the ICD-11 hierarchy. Otherwise they are listed as flat list of matches
         * @default true
         */
        flatResults?: boolean;
        /**
         * The properties to be searched. By default the system searches, Title, Synonyms and FullySpecifiedName.
         *             The valid values that could be used are: "Title", "Synonym", "NarrowerTerm", "FullySpecifiedName", "Definition" and "Exclusion"
         *             More than one property could be used with "," as the separator. In this case the results will include matches from any one of these properties
         */
        propertiesToBeSearched?: string;
        /**
         * This is an optional parameter and if ignored, the API will return values from the latest released version of the Foundation.
         *             If provided, the API will respond using that particular release. The values are like 2019-04. All releases are listed at https://icd.who.int/docs/icd-api/SupportedClassifications
         */
        releaseId?: string;
        /**
         * Optional. Default is true, if set to false the search result highlighting is turned off
         *             and the results don't contain special tags for highlighting where the results are found within the text
         * @default true
         */
        highlightingEnabled?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ISearchResult, void>({
        path: `/icd/entity/search`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Foundation
 * @name SearchFoundation2
 * @summary This endpoint is for searching the foundation component of the ICD-11. The search can be customized using the parameters as described. Search endpoint accepts both GET and POST requests. If the size of the request is too large, you may need to use POST
as HTTP GET has a size limit of 2K
 * @request POST:/icd/entity/search
 * @originalName searchFoundation
 * @duplicate
 * @secure
 */
    searchFoundation2: (
      query?: {
        /** Text to be searched. Having the character % at the end will be regarded as a wild card for that word */
        q?: string;
        /** Optional parameter. Comma separated list of URIs. If provided, the search will be performed on the entities provided and their descendants */
        subtreesFilter?: string;
        /** Optional, comma or semicolon separated list of chapter codes eg:01;02;21 When provided, the search will be performed only on these chapters */
        chapterFilter?: string;
        /**
         * Changes the search mode to flexible search.
         *             - In the regular search mode, the Coding Tool will only give you results that contain all of the words that you've used in your search. It accepts different variants or
         *             synonyms of the words but essentially it searches for a result that contains all components of your search. Whereas in flexible search mode, the results do not have to
         *             contain all of the words that are typed. It would still try to find the best matching phrase but there may be words in your search that are not matched at all
         *             - It is recommended to use flexible search only when regular search does not provide a result
         * @default false
         */
        useFlexisearch?: boolean;
        /**
         * Optional parameter. Default value false. If set to true the search result entities are provided in a nested data structure
         *             representing the ICD-11 hierarchy. Otherwise they are listed as flat list of matches
         * @default true
         */
        flatResults?: boolean;
        /**
         * The properties to be searched. By default the system searches, Title, Synonyms and FullySpecifiedName.
         *             The valid values that could be used are: "Title", "Synonym", "NarrowerTerm", "FullySpecifiedName", "Definition" and "Exclusion"
         *             More than one property could be used with "," as the separator. In this case the results will include matches from any one of these properties
         */
        propertiesToBeSearched?: string;
        /**
         * This is an optional parameter and if ignored, the API will return values from the latest released version of the Foundation.
         *             If provided, the API will respond using that particular release. The values are like 2019-04. All releases are listed at https://icd.who.int/docs/icd-api/SupportedClassifications
         */
        releaseId?: string;
        /**
         * Optional. Default is true, if set to false the search result highlighting is turned off
         *             and the results don't contain special tags for highlighting where the results are found within the text
         * @default true
         */
        highlightingEnabled?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ISearchResult, void>({
        path: `/icd/entity/search`,
        method: "POST",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Foundation
 * @name AutoCodeFoundation
 * @summary Provides the best matching classification entity (its code and URI) for the provided diagnostic text. see AutoCodingSearchResult
schema for information on the response.
 * @request GET:/icd/entity/autocode
 * @secure
 */
    autoCodeFoundation: (
      query?: {
        /** Input text for which the matching entity to be provided */
        searchText?: string;
        /** The id for the release. This is generally formatted like this: 2019-04. All releases are listed at https://icd.who.int/docs/icd-api/SupportedClassifications */
        releaseId?: string;
        /** Optional parameter. Comma separated list of URIs. If provided, the search will be performed on the entities provided and their descendants */
        subtreesFilter?: string;
        /**
         * score is a value between 0 and 1 that indicates the similarity between the input text and the matched term. matchThreshold the minimum score to be included in the output. The API will use default value if not provided
         * @format double
         */
        matchThreshold?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AutoCodingSearchResult, void>({
        path: `/icd/entity/autocode`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ICD10
     * @name GetIcd10Releases
     * @summary Lists the available ICD-10 releases
     * @request GET:/icd/release/10
     * @secure
     */
    getIcd10Releases: (params: RequestParams = {}) =>
      this.request<MultiVersion, void>({
        path: `/icd/release/10`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ICD10
     * @name GetIcd10Release
     * @summary This endpoint returns basic information on the released version of ICD-10 together with the chapters in it
     * @request GET:/icd/release/10/{releaseId}
     * @secure
     */
    getIcd10Release: (releaseId: string, params: RequestParams = {}) =>
      this.request<TopLevel, void>({
        path: `/icd/release/10/${releaseId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ICD10
     * @name GetAvailableReleasesForIcd10Entity
     * @summary Lists the available ICD-10 releases for the requested category
     * @request GET:/icd/release/10/{code}
     * @secure
     */
    getAvailableReleasesForIcd10Entity: (
      code: string,
      params: RequestParams = {},
    ) =>
      this.request<MultiVersion, void>({
        path: `/icd/release/10/${code}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ICD10
     * @name GetIcd10Entity
     * @summary This endpoint returns  information on the category together with its children categories
     * @request GET:/icd/release/10/{releaseId}/{code}
     * @secure
     */
    getIcd10Entity: (
      releaseId: string,
      code: string,
      params: RequestParams = {},
    ) =>
      this.request<ICD10Entity, void>({
        path: `/icd/release/10/${releaseId}/${code}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Linearization
 * @name GetReleasesForLinerization
 * @summary This endpoint returns basic information on the linearization such as MMS together with the list of 
available releases
 * @request GET:/icd/release/11/{linearizationname}
 * @secure
 */
    getReleasesForLinerization: (
      linearizationname: string,
      params: RequestParams = {},
    ) =>
      this.request<MultiVersion, void>({
        path: `/icd/release/11/${linearizationname}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Linearization
     * @name GetLinearization
     * @summary This endpoint returns basic information on the released linearization (such as MMS) together with the chapters in it
     * @request GET:/icd/release/11/{releaseId}/{linearizationname}
     * @secure
     */
    getLinearization: (
      linearizationname: string,
      releaseId: string,
      params: RequestParams = {},
    ) =>
      this.request<TopLevel, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Linearization
     * @name GetAvailableReleasesForLinearizationEntity
     * @summary This endpoint returns lists the URIs of the entity in the available releases
     * @request GET:/icd/release/11/{linearizationname}/{id}
     * @secure
     */
    getAvailableReleasesForLinearizationEntity: (
      linearizationname: string,
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<MultiVersion, void>({
        path: `/icd/release/11/${linearizationname}/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Linearization
     * @name GetAvailableReleasesForLinearizationResidualEntity
     * @summary This endpoint returns the list of the URIs of the residual entity in the available releases.
     * @request GET:/icd/release/11/{linearizationname}/{id}/{residual}
     * @secure
     */
    getAvailableReleasesForLinearizationResidualEntity: (
      linearizationname: string,
      id: string,
      residual: string,
      params: RequestParams = {},
    ) =>
      this.request<MultiVersion, void>({
        path: `/icd/release/11/${linearizationname}/${id}/${residual}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Linearization
     * @name GetLinearizationEntity
     * @summary This endpoint return information on a linearization entity
     * @request GET:/icd/release/11/{releaseId}/{linearizationname}/{id}
     * @secure
     */
    getLinearizationEntity: (
      linearizationname: string,
      releaseId: string,
      id: string,
      query?: {
        /**
         * Some property values such as ancestor and decendant lists are not provided in the response by default. However, it is possible
         *             to request them. These properties are ancestor, descendant and diagnosticCriteria. For example, if you set include=ancestor, the returned response will
         *             include all ancestor entity URIs for the requested entity.
         *             A comma separated list could be used to request multiple optional property values. e.g: include=ancestor,descendant
         */
        include?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<LinearizationEntity, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}/${id}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Linearization
     * @name GetLinearizationResidualEntity
     * @summary This endpoint return information on a residual linearization entity
     * @request GET:/icd/release/11/{releaseId}/{linearizationname}/{id}/{residual}
     * @secure
     */
    getLinearizationResidualEntity: (
      linearizationname: string,
      releaseId: string,
      id: string,
      residual: string,
      query?: {
        /**
         * Some property values such as ancestor and decendant lists are not provided in the response by default. However, it is possible
         *             to request them. For example, if you set include=ancestor the returned response will include all ancestor entity URIs for the requested entity.
         *             A comma separated list could be used to request multiple optional property values. (e.g. include=ancestor,descendant
         */
        include?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<LinearizationEntity, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}/${id}/${residual}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Linearization
 * @name Describe
 * @summary This endpoint provides information on a given code, uri or combination of them. 
For postcoordinated code combinations, it provides  more information on the code combination such as which axes are 
used and what values do they have. If the input is a code string such as 1A00&XN62R than it should be provided at the code paramter.
If the input is a uri string such as http://id.who.int/icd/... then it should be provided at the uri parameter.
The uri parameter accepts both foundation or linearization uris.
During the process, if the postcoordination combination has an equivalent precoordinated entity, the system will return the information on the precoordinated entity.
 * @request GET:/icd/release/11/{releaseId}/{linearizationname}/describe
 * @secure
 */
    describe: (
      linearizationname: string,
      releaseId: string,
      query?: {
        /** The code or code combination that will be looked up. (The & and / characters need to be URL encoded) */
        code?: string;
        /** Either foundation or linearization uri or uri combination that will be looked up. (The & and / characters need to be URL encoded) */
        uri?: string;
        /**
         * If set to true the postcoordinated code set will be simplified. For example, if GC08&XN6P4 is provided (Urinary tract infection & Escherichia coli), with simplified option, the result will be one code (GC08.0 Urinary tract infection, site not specified, due to Escherichia coli)
         * @default false
         */
        simplify?: boolean;
        /**
         * Normally, codeInfo returns an error when the provided code combination includes codes that are not in the predefined suggested value sets of the entity.
         *             If the flexibleMode is set to true, it will return a result even when some of the postcoordination values are not in these defined value sets. In this case, the codes
         *             whose postcoordination axis cannot be detected ('/' postcoordination) will be placed under otherPostcoordination rubric.
         * @default false
         */
        flexiblemode?: boolean;
        /**
         * by default it is false, if set to true, the codes and linearization URIs in the respone will be changed to use the terminal codes (leaf nodes in the hierarchy).
         *             In most cases this is done by changing the code to the unspecified resisual child. This does not affect the foundation URIs provided in the response
         * @default false
         */
        convertToTerminalCodes?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<PostcoordinationSet, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}/describe`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Linearization
 * @name GetCodeInfo
 * @summary This endpoint allows looking up an entity from its code. For postcoordinated code combinations, it provides 
more information on the code combination such as which axes are used and what values do they have
 * @request GET:/icd/release/11/{releaseId}/{linearizationname}/codeinfo/{code}
 * @secure
 */
    getCodeInfo: (
      linearizationname: string,
      releaseId: string,
      code: string,
      query?: {
        /**
         * Normally, codeInfo returns an error when the provided code combination includes codes that are not in the predefined suggested value sets of the entity.
         *             If the flexibleMode is set to true, it will return a result even when some of the postcoordination values are not in these defined value sets. In this case, the codes
         *             whose postcoordination axis cannot be detected ('/' postcoordination) will be placed under otherPostcoordination rubric.
         * @default false
         */
        flexiblemode?: boolean;
        /**
         * by default it is false, if set to true, the codes will be changed to use the terminal codes (leaf nodes in the hierarchy).
         *             In most cases this is done by changing the code to the unspecified resisual child
         * @default false
         */
        convertToTerminalCodes?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<CodeInfo, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}/codeinfo/${code}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description <br>If the foundation entity is included in the linearization and has a code then that linearization entity is returned. If the foundation entity in included in the linearization but it is a grouping without a code then the system will return the unspecified residual category under that grouping. <br>If the entity is not included in the linearization then the system checks where that entity is aggregated to and then returns that entity.
     *
     * @tags Linearization
     * @name Lookup
     * @summary This endpoint allows looking up a foundation entity within a linearization and returns where that entity is coded in this linearization.
     * @request GET:/icd/release/11/{releaseId}/{linearizationname}/lookup
     * @secure
     */
    lookup: (
      linearizationname: string,
      releaseId: string,
      query?: {
        /** The uri of the foundation entity that you'd like to map to this linearization */
        foundationUri?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<LinearizationEntity, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}/lookup`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Linearization
 * @name SearchLinearization
 * @summary This endpoint is for searching the linearization (such as MMS). The search can be customized using the parameters as described
Search endpoint accepts both GET and POST requests. If the size of the request is too large, you may need to use POST
as HTTP GET has a size limit of 2K
 * @request GET:/icd/release/11/{releaseId}/{linearizationname}/search
 * @secure
 */
    searchLinearization: (
      linearizationname: string,
      releaseId: string,
      query?: {
        /** Text to be searched. Having the character % at the end will be regarded as a wild card for that word */
        q?: string;
        /** Optional parameter. Comma separated list of URIs. If provided, the search will be performed on the entities provided and their descendants */
        subtreesFilter?: string;
        /**
         * When a subtree filter is used the search looks at the linearization descendants of the entities in the subtreefilter.
         *             If subtreeFilterUsesFoundationDescendants is set to true, the search looks at the foundation descendants of the entities in the subtreefilter
         * @default false
         */
        subtreeFilterUsesFoundationDescendants?: boolean;
        /**
         * Optional parameter. Default false.
         *             If set to true, the search result will also include keyword list
         *             - if the last word provided is incomplete, keyword list includes all words that start with the incomplete word (word completion mode)
         *             - if the last word is complete, the keyword list will provide suggested additional words that could be added to the search query. (word suggestion mode)
         *             The behavior can be seen in the 1st column of the ICD-11 Coding Tool search results
         * @default false
         */
        includeKeywordResult?: boolean;
        /**
         * Optional, comma or semicolon separated list of chapter codes eg:01;02;21 When provided, the search will be performed only on these chapters.
         *             If medicalCodingMode=true, the chapterFilter is set to not include all chapters but chapters 26, V and X
         */
        chapterFilter?: string;
        /**
         * Changes the search mode to flexible search.
         *             - In the regular search mode, the Coding Tool will only give you results that contain all of the words that you've used in your search. It accepts different variants or
         *             synonyms of the words but essentially it searches for a result that contains all components of your search. Whereas in flexible search mode, the results do not have to
         *             contain all of the words that are typed. It would still try to find the best matching phrase but there may be words in your search that are not matched at all
         *             - It is recommended to use flexible search only when regular search does not provide a result
         * @default false
         */
        useFlexisearch?: boolean;
        /**
         * Optional parameter. Default value false. If set to true the search result entities are provided in a nested data structure
         *             representing the ICD-11 hierarchy. Otherwise they are listed as flat list of matches
         * @default true
         */
        flatResults?: boolean;
        /**
         * Optional. Default is true, if set to false the search result highlighting is turned off
         *             and the results don't contain special tags for highlighting where the results are found within the text
         * @default true
         */
        highlightingEnabled?: boolean;
        /**
         * This mode is the default and it should be used when searching the classification for medical coding purposes.
         *             In this mode, the search gives results only from the entities that have a code. The system will search all index terms of an entity.
         *             i.e. titles, synonyms, fully specified term, all terms of other entities that are in the foundation and aggregated into this entity
         *             By default The chapters 26, V and X are not included in the search results
         * @default true
         */
        medicalCodingMode?: boolean;
        /**
         * The properties to be included in the search. Used only when medicalCodingMode=false.
         *             For example, if you'd like to search the definitions, then you need to set medicalCodingMode=false and propertiesToBeSearched=Definition
         *             The valid values that could be used are: "Title", "FullySpecifiedName", "Definition", "Exclusion" and "IndexTerm" (if "IndexTerm" is used, the search will be performed
         *             on all Titles, Synonyms and FullySpecifiedNames including the ones that are under shoreline (i.e Entities in the foundation but not in MMS. ) In such cases
         *             the results will be shown based on where the match is aggregated into in MMS.
         *             More than one property could be used with "," as the separator. In this case the results will include matches from any one of these properties
         */
        propertiesToBeSearched?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ISearchResult, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}/search`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Linearization
 * @name SearchLinearization2
 * @summary This endpoint is for searching the linearization (such as MMS). The search can be customized using the parameters as described
Search endpoint accepts both GET and POST requests. If the size of the request is too large, you may need to use POST
as HTTP GET has a size limit of 2K
 * @request POST:/icd/release/11/{releaseId}/{linearizationname}/search
 * @originalName searchLinearization
 * @duplicate
 * @secure
 */
    searchLinearization2: (
      linearizationname: string,
      releaseId: string,
      query?: {
        /** Text to be searched. Having the character % at the end will be regarded as a wild card for that word */
        q?: string;
        /** Optional parameter. Comma separated list of URIs. If provided, the search will be performed on the entities provided and their descendants */
        subtreesFilter?: string;
        /**
         * When a subtree filter is used the search looks at the linearization descendants of the entities in the subtreefilter.
         *             If subtreeFilterUsesFoundationDescendants is set to true, the search looks at the foundation descendants of the entities in the subtreefilter
         * @default false
         */
        subtreeFilterUsesFoundationDescendants?: boolean;
        /**
         * Optional parameter. Default false.
         *             If set to true, the search result will also include keyword list
         *             - if the last word provided is incomplete, keyword list includes all words that start with the incomplete word (word completion mode)
         *             - if the last word is complete, the keyword list will provide suggested additional words that could be added to the search query. (word suggestion mode)
         *             The behavior can be seen in the 1st column of the ICD-11 Coding Tool search results
         * @default false
         */
        includeKeywordResult?: boolean;
        /**
         * Optional, comma or semicolon separated list of chapter codes eg:01;02;21 When provided, the search will be performed only on these chapters.
         *             If medicalCodingMode=true, the chapterFilter is set to not include all chapters but chapters 26, V and X
         */
        chapterFilter?: string;
        /**
         * Changes the search mode to flexible search.
         *             - In the regular search mode, the Coding Tool will only give you results that contain all of the words that you've used in your search. It accepts different variants or
         *             synonyms of the words but essentially it searches for a result that contains all components of your search. Whereas in flexible search mode, the results do not have to
         *             contain all of the words that are typed. It would still try to find the best matching phrase but there may be words in your search that are not matched at all
         *             - It is recommended to use flexible search only when regular search does not provide a result
         * @default false
         */
        useFlexisearch?: boolean;
        /**
         * Optional parameter. Default value false. If set to true the search result entities are provided in a nested data structure
         *             representing the ICD-11 hierarchy. Otherwise they are listed as flat list of matches
         * @default true
         */
        flatResults?: boolean;
        /**
         * Optional. Default is true, if set to false the search result highlighting is turned off
         *             and the results don't contain special tags for highlighting where the results are found within the text
         * @default true
         */
        highlightingEnabled?: boolean;
        /**
         * This mode is the default and it should be used when searching the classification for medical coding purposes.
         *             In this mode, the search gives results only from the entities that have a code. The system will search all index terms of an entity.
         *             i.e. titles, synonyms, fully specified term, all terms of other entities that are in the foundation and aggregated into this entity
         *             By default The chapters 26, V and X are not included in the search results
         * @default true
         */
        medicalCodingMode?: boolean;
        /**
         * The properties to be included in the search. Used only when medicalCodingMode=false.
         *             For example, if you'd like to search the definitions, then you need to set medicalCodingMode=false and propertiesToBeSearched=Definition
         *             The valid values that could be used are: "Title", "FullySpecifiedName", "Definition", "Exclusion" and "IndexTerm" (if "IndexTerm" is used, the search will be performed
         *             on all Titles, Synonyms and FullySpecifiedNames including the ones that are under shoreline (i.e Entities in the foundation but not in MMS. ) In such cases
         *             the results will be shown based on where the match is aggregated into in MMS.
         *             More than one property could be used with "," as the separator. In this case the results will include matches from any one of these properties
         */
        propertiesToBeSearched?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ISearchResult, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}/search`,
        method: "POST",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Linearization
 * @name AutoCode
 * @summary Provides the best matching classification classification entity (its code, linearization URI, foundation URI and other related information) for the provided search text. 
see AutoCodingSearchResult schema for information on the response.
 * @request GET:/icd/release/11/{releaseId}/{linearizationname}/autocode
 * @secure
 */
    autoCode: (
      linearizationname: string,
      releaseId: string,
      query?: {
        /** Input text for which the matching entity to be provided. */
        searchText?: string;
        /**
         * Optional parameter. Comma separated list of URIs. If provided, the search will be performed on the entities provided and their descendants.
         *             When searching mms, by default chapters 26, V and X are not included
         */
        subtreesFilter?: string;
        /**
         * score is a value between 0 and 1 that indicates the similarity between the input text and the matched term. matchThreshold the minimum score to be included in the output. The API will use default value if not provided
         * @format double
         */
        matchThreshold?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AutoCodingSearchResult, void>({
        path: `/icd/release/11/${releaseId}/${linearizationname}/autocode`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * @description <strong>IMPORTANT! This endpoint is pre-release.</strong> The results may have issues and the API may change in the next releases.
 *
 * @tags Linearization
 * @name UnderlyingCauseOfDeathDetection1
 * @summary Underlying cause of death detection using the rules of the Doris system (https://icd.who.int/doris)   
The fields provided are fields of a standard death certificate. You don't need to provide causeOfDeathUri fields if you provide causeOfDeathCode fields or vice versa
 * @request GET:/icd/release/11/{releaseId}/doris
 * @secure
 */
    underlyingCauseOfDeathDetection1: (
      releaseId: string,
      query?: {
        /**
         * 1:Male, 2:Female, 9:Unknown
         * @format int32
         */
        sex?: number;
        /**
         * Provided in ISO_8601 format https://en.wikipedia.org/wiki/ISO_8601#Durations.
         *             E.g. P10YD 10 years, P9M 9 months, P5D 5 days, PT10H 10 hours, PT10M 10 minutes
         */
        estimatedAge?: string;
        /**
         * The date field used in the certificate is using the format defined in the W3C (https://www.w3.org/TR/NOTE-datetime)
         * @default ""
         */
        dateBirth?: string;
        /**
         * The date field used in the certificate is using the format defined in the W3C (https://www.w3.org/TR/NOTE-datetime)
         * @default ""
         */
        dateDeath?: string;
        /** Cause field A. Classification codes comma separated. Post coordinated codes can be used */
        causeOfDeathCodeA?: string;
        /** Cause field B. Classification codes comma separated. Post coordinated codes can be used */
        causeOfDeathCodeB?: string;
        /** Cause field C. Classification codes comma separated. Post coordinated codes can be used */
        causeOfDeathCodeC?: string;
        /** Cause field D. Classification codes comma separated. Post coordinated codes can be used */
        causeOfDeathCodeD?: string;
        /** Cause field E. Classification codes comma separated. Post coordinated codes can be used */
        causeOfDeathCodeE?: string;
        /** Cause field A. Classification URIs comma separated. Post coordinated URI strings can be used */
        causeOfDeathUriA?: string;
        /** Cause field B. Classification URIs comma separated. Post coordinated URI strings can be used */
        causeOfDeathUriB?: string;
        /** Cause field C. Classification URIs comma separated. Post coordinated URI strings can be used */
        causeOfDeathUriC?: string;
        /** Cause field D. Classification URIs comma separated. Post coordinated URI strings can be used */
        causeOfDeathUriD?: string;
        /** Cause field E. Classification URIs comma separated. Post coordinated URI strings can be used */
        causeOfDeathUriE?: string;
        /** Cause field Part2. Classification codes comma separated. Post coordinated codes can be used */
        causeOfDeathCodePart2?: string;
        /** Cause field Part2. Classification URIs comma separated. Post coordinated URI strings can be used */
        causeOfDeathUriPart2?: string;
        /**
         * Time interval from onset to death for Field A.  Provided in ISO_8601 format https://en.wikipedia.org/wiki/ISO_8601#Durations.
         *             E.g. P10YD 10 years, P9M 9 months, P5D 5 days, PT10H 10 hours, PT10M 10 minutes
         */
        intervalA?: string;
        /** Time interval from onset to death for Field B. Format same as IntervalA */
        intervalB?: string;
        /** Time interval from onset to death for Field C. Format same as IntervalA */
        intervalC?: string;
        /** Time interval from onset to death for Field D. Format same as IntervalA */
        intervalD?: string;
        /** Time interval from onset to death for Field E. Format same as IntervalA */
        intervalE?: string;
        /**
         * 0: No, 1: Yes - 9: Unknown
         * @format int32
         */
        surgeryWasPerformed?: number;
        /** Surgery date using the format defined in the W3C (https://www.w3.org/TR/NOTE-datetime) */
        surgeryDate?: string;
        /** Reason for surgery */
        surgeryReason?: string;
        /**
         * 0: No, 1: Yes, 9: Unknown
         * @format int32
         */
        autopsyWasRequested?: number;
        /**
         * 0: No, 1: Yes, 9: Unknown
         * @format int32
         */
        autopsyFindings?: number;
        /**
         * 0: Disease, 1: Accident, 2: Intentional self harm, 3: Assault, 4: Legal intervention, 5: War, 6: Could not be determined, 7: Pending investigation, 9: Unknown
         * @format int32
         */
        mannerOfDeath?: number;
        /** Date of external cause or poisoning using the format defined in the W3C (https://www.w3.org/TR/NOTE-datetime) */
        mannerOfDeathDateOfExternalCauseOrPoisoning?: string;
        /** Description external cause */
        mannerOfDeathDescriptionExternalCause?: string;
        /**
         * 0: At home, 1: Residential institution, 2: School, other institution, public administration area, 3: Sports and athletics area, 4: Street and highway, 5: Trade and service area, 6: Industrial and construction area, 7: Farm, 8: Other place, 9: Unknown
         * @format int32
         */
        mannerOfDeathPlaceOfOccuranceExternalCause?: number;
        /**
         * 0: No, 1: Yes, 9: Unknown
         * @format int32
         */
        fetalOrInfantDeathMultiplePregnancy?: number;
        /**
         * 0: No, 1: Yes, 9: Unknown
         * @format int32
         */
        fetalOrInfantDeathStillborn?: number;
        /**
         * If death within 24h specify number of hours survived.
         * @format int32
         */
        fetalOrInfantDeathDeathWithin24h?: number;
        /**
         * Birth weight (in grams).
         * @format int32
         */
        fetalOrInfantDeathBirthWeight?: number;
        /**
         * Number of completed weeks of pregnancy.
         * @format int32
         */
        fetalOrInfantDeathPregnancyWeeks?: number;
        /**
         * Age of mother (years).
         * @format int32
         */
        fetalOrInfantDeathAgeMother?: number;
        /** If death was perinatal, please state condition of mother that affected the fetus and newborn. */
        fetalOrInfantDeathPerinatalDescription?: string;
        /**
         * For women, was the deceased pregnant  0: No, 1: Yes, - 9: Unknown
         * @format int32
         */
        maternalDeathWasPregnant?: number;
        /**
         * 0: "At time of death", - 1: "Within 42 days before the death", - 2: "Between 43 days up to 1 year before death", - 3: "One year or more before death", - 9: Unknown
         * @format int32
         */
        maternalDeathTimeFromPregnancy?: number;
        /**
         * Did pregnancy contribute to death   0: No, 1: Yes, - 9: Unknown
         * @format int32
         */
        maternalDeathPregnancyContribute?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<UnderlyingCauseOfDeath, void>({
        path: `/icd/release/11/${releaseId}/doris`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Linearization
 * @name UnderlyingCauseOfDeathDetection
 * @summary Underlying cause of death detection using the rules of the Doris system (https://icd.who.int/doris) 
The structure of the posted death certificate could be found at https://icd.who.int/docs/doris/en/json-format
 * @request POST:/icd/release/11/{releaseId}/doris
 * @secure
 */
    underlyingCauseOfDeathDetection: (
      releaseId: string,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<UnderlyingCauseOfDeath, void>({
        path: `/icd/release/11/${releaseId}/doris`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
