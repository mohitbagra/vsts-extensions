import "./BugBashCharts.scss";

import * as React from "react";

import { BugBashItemActions } from "BugBashPro/Actions/BugBashItemActions";
import { SettingsActions } from "BugBashPro/Actions/SettingsActions";
import {
    BugBashItemFieldNames, BugBashViewActions, WorkItemFieldNames
} from "BugBashPro/Constants";
import { INameValuePair } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { BugBash } from "BugBashPro/ViewModels/BugBash";
import { BugBashItem } from "BugBashPro/ViewModels/BugBashItem";
import { Loading } from "Common/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { TeamActions } from "Common/Flux/Actions/TeamActions";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { isGuid } from "Common/Utilities/Guid";
import {
    getDistinctNameFromIdentityRef, IdentityRef, parseUniquefiedIdentityName
} from "Common/Utilities/Identity";
import { Checkbox } from "OfficeFabric/Checkbox";
import { Label } from "OfficeFabric/Label";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ZeroData } from "VSSUI/ZeroData";

interface IBugBashChartsState extends IBaseFluxComponentState {
    allBugBashItems: BugBashItem[];
    pendingBugBashItems: BugBashItem[];
    acceptedBugBashItems: BugBashItem[];
    rejectedBugBashItems: BugBashItem[];
    groupedByTeam?: boolean;
}

interface IBugBashChartsProps extends IBaseFluxComponentProps {
    bugBash: BugBash;
    view?: string;
}

const CustomAxisTick: React.StatelessComponent<any> =
    (props: any): JSX.Element => {
        const {x, y, payload} = props;
        const value = (payload.value.length > 9) ? `${payload.value.substr(0, 9)}...` : payload.value;
        return (
            <g transform={`translate(${x - 4},${y + 2})`}>
                <text fill="#767676" style={{fontSize: "12px"}} width={100} textAnchor="end">{value}</text>
            </g>
        );
    };

const CustomTooltip: React.StatelessComponent<any> =
    (props: any): JSX.Element => {
        const data: INameValuePair = props && props.payload && props.payload[0] && props.payload[0].payload;
        if (!data) {
            return null;
        }

        if (!data.members || data.members.length === 0) {
            return <div className="chart-tooltip"><span className="tooltip-key">{data["name"]}</span> : <span className="tooltip-value">{data["value"]}</span></div>;
        }
        else {
            return (
                <div className="chart-tooltip">
                    <div className="team-name"><span className="tooltip-key">{data["name"]}</span> : <span className="tooltip-value">{data["value"]}</span></div>
                    { data.members.map((member: INameValuePair) => {
                        return <div key={member.name}><span className="tooltip-key">{member.name}</span> : <span className="tooltip-value">{member.value}</span></div>;
                    })}
                </div>
            );
        }
    };

export class BugBashCharts extends BaseFluxComponent<IBugBashChartsProps, IBugBashChartsState> {
    public componentDidMount() {
        super.componentDidMount();
        TeamActions.initializeTeams();
        BugBashItemActions.initializeItems(this.props.bugBash.id);
        SettingsActions.initializeUserSettings();
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        let bugBashItems: BugBashItem[] = this.state.allBugBashItems;
        if (this.props.view === BugBashViewActions.AcceptedItemsOnly) {
            bugBashItems = this.state.acceptedBugBashItems;
        }
        else if (this.props.view === BugBashViewActions.RejectedItemsOnly) {
            bugBashItems = this.state.rejectedBugBashItems;
        }
        else if (this.props.view === BugBashViewActions.PendingItemsOnly) {
            bugBashItems = this.state.pendingBugBashItems;
        }

        if (bugBashItems.length === 0) {
            return (
                <ZeroData
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                    imageAltText=""
                    primaryText="No results"
                />
            );
        }

        const assignedToTeamCounts: IDictionaryStringTo<number> = {};
        const createdByCounts: IDictionaryStringTo<{count: number, members: IDictionaryStringTo<number>}> = {};
        const assignedToTeamData: INameValuePair[] = [];
        const createdByData: INameValuePair[] = [];

        for (const bugBashItem of bugBashItems) {
            const createdByUser = bugBashItem.getFieldValue<IdentityRef>(BugBashItemFieldNames.CreatedBy, true);
            const createdBy = getDistinctNameFromIdentityRef(createdByUser);
            const userSetting = StoresHub.userSettingsStore.getItem(createdByUser.uniqueName);
            const associatedTeamId = userSetting ? userSetting.associatedTeam : "";
            const associatedTeam = associatedTeamId ? StoresHub.teamStore.getItem(associatedTeamId) : null;

            let teamId: string;
            if (bugBashItem.isAccepted) {
                teamId = bugBashItem.workItem.fields[WorkItemFieldNames.AreaPath];
            }
            else {
                teamId = bugBashItem.getFieldValue<string>(BugBashItemFieldNames.TeamId, true);
            }
            assignedToTeamCounts[teamId] = (assignedToTeamCounts[teamId] || 0) + 1;

            if (associatedTeam && this.state.groupedByTeam) {
                if (createdByCounts[associatedTeam.name] == null) {
                    createdByCounts[associatedTeam.name] = {
                        count: 0,
                        members: {}
                    };
                }
                createdByCounts[associatedTeam.name].count = createdByCounts[associatedTeam.name].count + 1;
                createdByCounts[associatedTeam.name].members[createdBy] = (createdByCounts[associatedTeam.name].members[createdBy] || 0) + 1;
            }
            else {
                if (createdByCounts[createdBy] == null) {
                    createdByCounts[createdBy] = {
                        count: 0,
                        members: {}
                    };
                }
                createdByCounts[createdBy].count = createdByCounts[createdBy].count + 1;
            }
        }

        for (const teamId of Object.keys(assignedToTeamCounts)) {
            assignedToTeamData.push({ name: this._getTeamName(teamId), value: assignedToTeamCounts[teamId]});
        }

        for (const createdBy of Object.keys(createdByCounts)) {
            const membersMap = createdByCounts[createdBy].members;
            const membersArr: INameValuePair[] = $.map(membersMap, (count: number, key: string) => {
                return {name: parseUniquefiedIdentityName(key).displayName, value: count};
            });
            membersArr.sort((a, b) => b.value - a.value);

            createdByData.push({ name: parseUniquefiedIdentityName(createdBy).displayName, value: createdByCounts[createdBy].count, members: membersArr});
        }

        assignedToTeamData.sort((a, b) => b.value - a.value);
        createdByData.sort((a, b) => b.value - a.value);

        return (
            <div className="bugbash-charts">
                { this.props.view !== BugBashViewActions.AllItems &&
                    <div className="chart-view-container">
                        <div className="header-container">
                            <Label className="header">{`Assigned to ${this.props.view === BugBashViewActions.AcceptedItemsOnly ? "area path" : "team"} (${bugBashItems.length})`}</Label>
                        </div>
                        <div className="chart-view">
                            <ResponsiveContainer width="95%">
                                <BarChart
                                    layout={"vertical"}
                                    width={600}
                                    height={600}
                                    data={assignedToTeamData}
                                    barSize={5}
                                    margin={{top: 5, right: 30, left: 20, bottom: 5}}
                                >
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" tick={<CustomAxisTick />} allowDecimals={false} />
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <Tooltip isAnimationActive={false} />
                                    <Bar isAnimationActive={false} dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                }
                <div className="chart-view-container">
                    <div className="header-container">
                        <Label className="header">{`Created By (${bugBashItems.length})`}</Label>
                        <Checkbox
                            label="Group by team"
                            checked={this.state.groupedByTeam}
                            className="group-by-checkbox"
                            onChange={this._toggleGroupByTeam}
                        />
                    </div>
                    <div className="chart-view">
                        <ResponsiveContainer width="95%">
                            <BarChart
                                layout={"vertical"}
                                width={600}
                                height={600}
                                data={createdByData}
                                barSize={5}
                                margin={{top: 5, right: 30, left: 20, bottom: 5}}
                            >
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={<CustomAxisTick />} allowDecimals={false} />
                                <CartesianGrid strokeDasharray="3 3"/>
                                <Tooltip isAnimationActive={false} content={<CustomTooltip/>}/>
                                <Bar isAnimationActive={false} dataKey="value" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    }

    protected initializeState() {
        this.state = {
            allBugBashItems: null,
            pendingBugBashItems: null,
            rejectedBugBashItems: null,
            acceptedBugBashItems: null,
            loading: true,
            groupedByTeam: true
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.bugBashItemStore, StoresHub.teamStore, StoresHub.userSettingsStore];
    }

    protected getStoresState(): IBugBashChartsState {
        const bugBashItems = StoresHub.bugBashItemStore.getFilteredItems();

        return {
            loading: StoresHub.bugBashItemStore.isLoading(this.props.bugBash.id) || StoresHub.teamStore.isLoading() || StoresHub.userSettingsStore.isLoading(),
            allBugBashItems: bugBashItems,
            pendingBugBashItems: bugBashItems ? bugBashItems.filter(b => !b.isAccepted && !b.getFieldValue<boolean>(BugBashItemFieldNames.Rejected, true)) : null,
            acceptedBugBashItems: bugBashItems ? bugBashItems.filter(b => b.isAccepted) : null,
            rejectedBugBashItems: bugBashItems ? bugBashItems.filter(b => !b.isAccepted && b.getFieldValue<boolean>(BugBashItemFieldNames.Rejected, true)) : null
        } as IBugBashChartsState;
    }

    private _getTeamName(teamId: string): string {
        if (isGuid(teamId)) {
            // is a team if
            const team = StoresHub.teamStore.getItem(teamId);
            return team ? team.name : teamId;
        }
        else {
            // is an area path
            return teamId.substr(teamId.lastIndexOf("\\") + 1);
        }
    }

    private _toggleGroupByTeam = () => {
        this.setState({groupedByTeam: !this.state.groupedByTeam} as IBugBashChartsState);
    }
}
