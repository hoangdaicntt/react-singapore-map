import React from 'react';
import rawMapData from './map.json';

type AttributeValue = string | number;
type Attributes = Record<string, AttributeValue>;

type SvgElement = {
    type: 'path' | 'circle';
    id?: string; // e.g., "Path[id]", "Dot[id]", "Text[id]" where [id] is the postal code
    [key: string]: AttributeValue | undefined;
};

type SvgGroup = {
    id: "BackgroundGroup" | "PathGroup" | "TextGroup" | "DotGroup";
    attributes: Attributes;
    elements: SvgElement[];
};

export type MapData = {
    width?: number;
    height?: number;
    viewBox?: string;
    groups: SvgGroup[];
};

const mapData = rawMapData as MapData;

const toCamelCase = (key: string) => key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

const normalizeAttributes = (attributes: { [key: string]: AttributeValue | undefined }) => {
    const normalized: Record<string, AttributeValue> = {};
    // @ts-ignore
    Object.entries(attributes).forEach(([key, value]) => {
        if (value === undefined) return;
        normalized[toCamelCase(key)] = value;
    });

    return normalized;
};

export type PostalCode = number;
export type ContentPlacement =
    'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'centerLeft'
    | 'center'
    | 'centerRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight';
type PostalCodeEventHandler = (postalCode: PostalCode) => void;
type RegionRenderer = (postalCode: PostalCode, coords: { cx: number; cy: number; r?: number }) => React.ReactNode;

const parseId = (rawId?: string) => {
    if (!rawId) return {original: undefined, numeric: undefined, prefix: undefined};
    const match = rawId.match(/^([A-Za-z]+)(\d+)$/);

    if (match) {
        return {original: rawId, prefix: match[1], numeric: Number(match[2])};
    }

    return {original: rawId, prefix: undefined, numeric: undefined};
};

const resolveRegionFill = (rawId: string | undefined, regionFills?: Record<PostalCode, string>, defaultColor?: string) => {
    if (!rawId || !regionFills) return defaultColor || undefined;
    const {numeric} = parseId(rawId);
    if (numeric !== undefined && regionFills[numeric] !== undefined) return regionFills[numeric];
    return defaultColor || undefined;
};

type SingaporeMapProps = {
    className?: string;
    background?: boolean; // Control whether to render BackgroundGroup
    regionFills?: Record<PostalCode, string>; // For PathGroup path elements
    defaultRegionFill?: string; // For PathGroup path elements
    regionTextFills?: Record<PostalCode, string>; // For TextGroup text elements
    defaultRegionTextFill?: string; // For TextGroup text elements
    onHover?: PostalCodeEventHandler;
    onLeave?: PostalCodeEventHandler;
    onClick?: PostalCodeEventHandler;
    renderRegion?: RegionRenderer;
    regionContents?: Record<PostalCode, React.ReactNode>;
    placement?: ContentPlacement;
};

const SingaporeMap: React.FC<SingaporeMapProps> = ({
                                                       className,
                                                       regionFills,
                                                       regionTextFills,
                                                       background = true,
                                                       onHover,
                                                       onLeave,
                                                       onClick,
                                                       renderRegion,
                                                       regionContents,
                                                       placement = 'topCenter',
                                                       defaultRegionFill = "",
                                                       defaultRegionTextFill = "",
                                                   }) => {
    const {width, height, viewBox, groups} = mapData;
    const pathGroup = groups.find((group) => group.id === 'PathGroup');

    const getTransformByPlacement = (placement: ContentPlacement): string => {
        const transforms: Record<ContentPlacement, string> = {
            topLeft: 'translate(0, -100%)',
            topCenter: 'translate(-50%, -100%)',
            topRight: 'translate(-100%, -100%)',
            centerLeft: 'translate(0, -50%)',
            center: 'translate(-50%, -50%)',
            centerRight: 'translate(-100%, -50%)',
            bottomLeft: 'translate(0, 0)',
            bottomCenter: 'translate(-50%, 0)',
            bottomRight: 'translate(-100%, 0)',
        };
        return transforms[placement];
    };

    const getRegionEventProps = (postalCode?: PostalCode) =>
        postalCode && (onHover || onLeave || onClick) ? {
                onMouseEnter: () => onHover?.(postalCode),
                onMouseLeave: () => onLeave?.(postalCode),
                onClick: () => onClick?.(postalCode),
            }
            : undefined;

    const renderElement = (element: SvgElement, index: number, groupId: string) => {
        const {type, id, ...rest} = element;
        const props = normalizeAttributes({id, ...rest});
        const key = id ?? `${type}-${index}`;
        const {prefix, numeric} = parseId(id);
        const postalCode: PostalCode | undefined = numeric;

        if (type === 'circle') {
            if ((renderRegion || regionContents) && prefix === 'Dot' && postalCode !== undefined) {
                const circleNode = <circle key={`${key}-circle`} {...props} />;
                const cx = Number(props.cx);
                const cy = Number(props.cy);
                const r = props.r !== undefined ? Number(props.r) : undefined;

                // Priority: renderRegion function > regionContents record
                const content = renderRegion
                    ? renderRegion(postalCode, {cx, cy, r})
                    : regionContents?.[postalCode];

                return (
                    <g key={key}>
                        {/*{circleNode}*/}
                        {content && (
                            <foreignObject
                                x={0}
                                y={0}
                                width="100%"
                                height="100%"
                                style={{overflow: 'visible', pointerEvents: 'none'}}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${cx}px`,
                                        top: `${cy}px`,
                                        transform: getTransformByPlacement(placement),
                                        display: 'inline-block',
                                        pointerEvents: 'auto',
                                    }}
                                >
                                    {content}
                                </div>
                            </foreignObject>
                        )}
                    </g>
                );
            }

            return null;
        }

        // Handle fill based on group type
        let fill: string | undefined;
        if (groupId === 'PathGroup') {
            // Apply regionFills only for PathGroup paths
            fill = resolveRegionFill(id, regionFills, defaultRegionFill);
        } else if (groupId === 'TextGroup') {
            // Apply regionTextFills only for TextGroup text elements
            fill = resolveRegionFill(id, regionTextFills, defaultRegionTextFill);
        }

        return <path key={key} {...props} {...(fill ? {fill} : null)} />;
    };

    return (
        <svg
            className={className}
            width={width}
            height={height}
            viewBox={viewBox}
            xmlns="http://www.w3.org/2000/svg"
        >
            {groups
                .filter((group) => background || group.id !== 'BackgroundGroup')
                .map((group) => (
                    <g key={group.id} id={group.id} {...normalizeAttributes(group.attributes)}>
                        {group.elements.map((element, index) => renderElement(element, index, group.id))}
                    </g>
                ))}
            {pathGroup && (
                <g
                    key="PathGroupTransparent"
                    id="PathGroupTransparent"
                    {...normalizeAttributes(pathGroup.attributes)}
                >
                    {pathGroup.elements.map((element, index) => {
                        if (element.type !== 'path') return null;
                        const {id, ...rest} = element;
                        const overlayId = id ? `${id}-transparent` : undefined;
                        const props = normalizeAttributes({id: overlayId, ...rest, fill: 'transparent'});
                        const {numeric} = parseId(id);
                        const postalCode: PostalCode | undefined = numeric;
                        const key = `${id ?? `path-${index}`}-transparent`;

                        const eventProps = getRegionEventProps(postalCode);

                        return <path key={key} {...props} {...eventProps} />;
                    })}
                </g>
            )}
        </svg>
    );
};

export default SingaporeMap;
