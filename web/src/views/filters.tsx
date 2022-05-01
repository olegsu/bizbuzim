import { useState } from "react";
import _ from "lodash";
import styled from "styled-components";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import OutlinedInput from "@mui/material/OutlinedInput";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import { BsFilter } from "react-icons/bs";
import { useQuery } from "@apollo/client";

import { GET_TAGS } from "../queries/get-tags";

import { DatePicker } from "./../components/date-picker";

const FiltersContainer = styled.div`
  display: inline-flex;
`;

const FilterContainer = styled.div`
  display: inline-flex;
  flex-direction: row;
  margin: 1em;
  margin-bottom: 0;
  min-width: 10em;
  max-width: 15em;
  max-height: 5em;
`;

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export interface Props {
  fromDate?: Date;
  fromDateChange: (d: Date) => void;
  toDate?: Date;
  toDateChange: (d: Date) => void;
}
export function Filters(props: Props) {
  const [fromDate, setFromDate] = useState(props.fromDate || new Date());
  const [toDate, setToDate] = useState(props.toDate || new Date());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { error, loading, data } = useQuery(GET_TAGS, {
    variables: {
      from: fromDate,
      to: toDate,
    },
  });
  if (loading) {
    return (
      <>
        <div>loading</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div>error: {error}</div>
      </>
    );
  }
  const tags = _.chain(data.expenses)
    .map((v) => v.tags)
    .flatten()
    .uniq()
    .map((v) =>
      Object.assign({
        value: v,
        label: v,
      })
    )
    .value();
  return (
    <>
      <FiltersContainer>
        <BsFilter size={"2em"} />
        <FilterContainer>
          <DatePicker
            initial={fromDate}
            label="Date From"
            onDateChanged={(d) => {
              setFromDate(d);
              props.fromDateChange(d);
            }}
          />
        </FilterContainer>
        <FilterContainer>
          <DatePicker
            initial={toDate}
            label="Date To"
            onDateChanged={(d) => {
              setToDate(d);
              props.toDateChange(d);
            }}
          />
        </FilterContainer>
        <FilterContainer>
          <Select
            multiple
            value={selectedTags}
            onChange={(event: SelectChangeEvent<string[]>) => {
              const {
                target: { value },
              } = event;
              setSelectedTags(
                typeof value === "string" ? value.split(",") : value
              );
            }}
            input={<OutlinedInput />}
            renderValue={(selected: string[]) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value: string) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {tags.map((tag, i) => (
              <MenuItem key={tag.label} value={tag.value}>
                {tag.label}
              </MenuItem>
            ))}
          </Select>
        </FilterContainer>
      </FiltersContainer>
    </>
  );
}