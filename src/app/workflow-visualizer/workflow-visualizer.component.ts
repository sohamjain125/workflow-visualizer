import { Component, OnInit, ViewChild } from '@angular/core';
import { TreeNode, MenuItem, MessageService, TreeDragDropService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { ChangeDetectionStrategy } from '@angular/core';
import { WorkflowDataService } from '../service/workflow-data.service';
import { cloneDeep } from 'lodash';

interface WorkflowMetadata {
  _name: string;
  _initialStatus: string;
  _EmailAdmin: string;
  _SMSAdmin: string;
  _PreAppInitStatus: string;
}

interface Template {
  _name: string;
  _saveToRelatedDoc: boolean;
  _securePDF: boolean;
  _isActive?: string;
  _isRequired?: string;
  _description?: string;
  _category?: string;
}

interface Letters {
  template: Template | Template[];
}

interface BusinessRule {
  _name: string;
  _ErrorMessage: string;
  _isActive?: string;
  _isRequired?: string;
  _description?: string;
  _category?: string;
}

interface BusinessRules {
  rule: BusinessRule[];
}

interface Action {
  _type: 'email' | 'sms' | 'task' | 'decision' | 'document' | 'APICall';
  _addressee: string;
  _subject?: string;
  _template?: string;
  _content?: string;
  _isReviewable?: string;
  _previewOnly?: string;
  _access?: string;
  _documentFolder?: string;
  _docType?: string;
  _mailMergeDataSource?: string;
  _decisionType?: string;
  _commencedBy?: string;
  _completedBy?: string;
  _isCombineAllotment?: string;
  _isSubdivision?: string;
  _displayLocation?: string;
  _costOfDevelopment?: string;
  _OPBuildingPart?: string;
  _isActive?: string;
  _isRequired?: string;
  _description?: string;
  _category?: string;
  letters?: Letters;
}

interface Reminder {
  _content: string;
  _isActive?: string;
  _isRequired?: string;
  _description?: string;
  _category?: string;
}

interface Transition {
  _input: string;
  _next: string;
  _selectAttachment: string;
  _isActive?: string;
  _isRequired?: string;
  _description?: string;
  _category?: string;
  action?: Action[];
  reminder?: Reminder[];
  businessRules?: BusinessRules;
}

interface State {
  _name: string;
  _IdleDays: string;
  _assignedStaff?: string;
  _isActive?: string;
  _isRequired?: string;
  _description?: string;
  _category?: string;
  transition?: Transition[];
}

interface WorkflowData extends WorkflowMetadata {
  state: State[];
}

interface EditForm {
  // Common properties
  name: string;
  type?: string;
  idleDays?: string;
  assignedStaff?: string;
  initialStatus?: string;
  emailAdmin?: string;
  smsAdmin?: string;
  preAppInitStatus?: string;

  // Action properties
  actionType?: 'email' | 'sms' | 'task' | 'decision' | 'document' | 'APICall';
  addressee?: string[];
  subject?: string;
  template?: string;
  content?: string;
  isReviewable?: boolean;
  previewOnly?: boolean;
  access?: string;
  documentFolder?: string;
  docType?: string;
  mailMergeDataSource?: string;

  // Decision properties
  decisionType?: string;
  commencedBy?: string;
  completedBy?: string;
  isCombineAllotment?: boolean;
  isSubdivision?: boolean;
  displayLocation?: string;
  costOfDevelopment?: string;
  OPBuildingPart?: string;

  // Transition properties
  input?: string;
  next?: string;
  selectAttachment?: boolean;

  // Template properties
  saveToRelatedDoc?: boolean;
  securePDF?: boolean;
  templates?: Template[];
  
  // Business Rules
  businessRules?: BusinessRule[];
}

interface MultiNodeForm {
  type?: string;
  nodes: EditForm[];
}

interface NodeTypeConfig {
  allowedChildren: string[];
  requiredFields: string[];
  parentTypes: string[];
}

interface ChangeHistoryEntry {
  description: string;
  timestamp: Date;
  canUndo: boolean;
}

@Component({
  selector: 'app-workflow-visualizer',
  templateUrl: './workflow-visualizer.component.html',
  styleUrls: ['./workflow-visualizer.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [TreeDragDropService]
})
export class WorkflowVisualizerComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  smsTemplates: any[] = [];
  emailTemplates: any[] = [];
  addresseeOptions: any[] = [];
  assignedStaffOptions: any[] = [];
  isTableCollapsed: boolean = false;
  searchText: string = '';
  applicationTypes: any[] = [
    { label: 'All', value: null },
    { label: 'Type1', value: 'type1' },
    { label: 'Type2', value: 'type2' }
  ];
  applicationType: any = null;
  loading: boolean = false;
  fileUploaded: boolean = false;
  editingKey: string | null = null;
  draftValue: string = '';
  showJsonEditor: boolean = false;
  jsonEditorContent: string = '';
  treeData: TreeNode[] = [];
  selectedNode: TreeNode | null = null;
  editDialogVisible: boolean = false;
  editForm: EditForm = {
    name: '',
    actionType: 'email',
    addressee: []
  };

  actionTypes: Array<{label: string, value: Action['_type']}> = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
    { label: 'Task', value: 'task' },
    { label: 'Decision', value: 'decision' },
    { label: 'Document', value: 'document' },
    { label: 'APICall', value: 'APICall' }
  ];

  apiCallOptions: Array<{label: string, value: string}> = [
    { label: 'Accept', value: 'Accept' },
    { label: 'Assessment', value: 'Assessment' },
    { label: 'Assigned Surveyor', value: 'AssignedSurveyor' },
    { label: 'Complete Inspection', value: 'CompleteInspection' },
    { label: 'Determination', value: 'Determination' },
    { label: 'Determine', value: 'Determine' },
    { label: 'Initiate Inspection', value: 'InitiateInspection' },
    { label: 'Perform Inspection', value: 'PerformInspection' },
    { label: 'Provide Dev Spec', value: 'ProvideDevspec' },
    { label: 'Reassign', value: 'Reassign' },
    { label: 'Referral Request', value: 'RefrralRequest' },
    { label: 'Request Additional Info', value: 'ReqAddInfo' },
    { label: 'Return', value: 'Return' }
  ];

  nodeTypeConfigs: { [key: string]: NodeTypeConfig } = {
    state: {
      allowedChildren: ['transition'],
      requiredFields: ['name', 'idleDays'],
      parentTypes: []  // States can only be at root level
    },
    transition: {
      allowedChildren: ['action', 'reminder'],
      requiredFields: ['input', 'next'],
      parentTypes: ['state']
    },
    action: {
      allowedChildren: ['template'],
      requiredFields: ['actionType', 'addressee'],
      parentTypes: ['transition']
    },
    template: {
      allowedChildren: [],
      requiredFields: ['name'],
      parentTypes: ['action']
    },
    reminder: {
      allowedChildren: [],
      requiredFields: ['content'],
      parentTypes: ['transition']
    }
  };

  nodeTypes: Array<{label: string, value: string}> = [
    { label: 'State', value: 'state' },
    { label: 'Transition', value: 'transition' },
    { label: 'Action', value: 'action' },
    { label: 'Template', value: 'template' },
    { label: 'Reminder', value: 'reminder' }
  ];

  
  

  booleanOptions: any[] = [
    { label: 'True', value: true },
    { label: 'False', value: false }
  ];

  showAddNodeDialog: boolean = false;
  multiNodeForm: MultiNodeForm = {
    type: '',
    nodes: []
  };

  // Add workflow metadata properties
  workflowName: string = '';
  initialStatus: string = '';
  emailAdmin: string = '';
  smsAdmin: string = '';
  preAppInitStatus: string = '';

  // Add missing properties
  preApplicationInitialStatus: string = '';
  selectedApplicationType: string = '';

  // Add new properties for IDs
  licenseId: number | null = null;
  applicationId: number | null = null;

  dragDropNodes: TreeNode[] = [];
  isDragging: boolean = false;
  workflowData: WorkflowData = {
    _name: "BuildingPermit",
    _initialStatus: "New",
    _EmailAdmin: "yes",
    _SMSAdmin: "yes",
    _PreAppInitStatus: "NewPreApplication",
    state: []
  };
  nodeMenu: MenuItem[] = [];
  draggedNode: TreeNode | null = null;

  showAddAddressDialog: boolean = false;
  newAddress: { label: string; value: string } = { label: '', value: '' };
  selectedNodeForAddress: TreeNode | null = null;

  // Add history management properties
  private historyStack: TreeNode[][] = [];
  public currentHistoryIndex: number = -1;
  private maxHistorySize: number = 50;
  canUndo: boolean = false;
  canRedo: boolean = false;

  // Add change history properties
  changeHistory: ChangeHistoryEntry[] = [];
  showChangeHistory: boolean = false;

  constructor( private workflowDataService: WorkflowDataService,private messageService: MessageService) {
    this.initializeSampleData();
  }

  ngOnInit() {
    this.loadEmailTemplatesAndAddressees();
    this.initializeContextMenu();
  }
  loadEmailTemplatesAndAddressees() {
    // Get email templates only if both IDs are provided
    if (this.licenseId && this.applicationId) {
      this.workflowDataService.getEmailTemplates(this.licenseId, this.applicationId).subscribe({
        next: (templates) => {
          this.emailTemplates = templates;
          console.log('Email templates loaded:', templates);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load email templates'
          });
          console.error('Error loading templates:', error);
        }
      });
    }

    // Get addressees
    this.workflowDataService.getAddressees().subscribe({
      next: (addressees) => {
        this.addresseeOptions = addressees;
        console.log('Addressees loaded:', addressees);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load addressees'
        });
        console.error('Error loading addressees:', error);
      }
    });
  }
  initializeSampleData() {
    this.treeData = [
      {
        data: { type: 'state', name: 'New' },
        children: [
          {
            data: { 
              type: 'action',
              name: 'Send Email',
              actionType: 'email',
              addressee: ['applicant']
            }
          }
        ]
      },
      {
        data: { type: 'state', name: 'Submitted' },
        children: []
      },
      {
        data: { type: 'state', name: 'Payment Requested' },
        children: []
      },
      {
        data: { type: 'state', name: 'Payment Received' },
        children: []
      }
    ];
  }

  getFilteredData(): TreeNode[] {
    if (!this.searchText && !this.applicationType) {
      return this.treeData;
    }

    return this.treeData.filter(node => {
      const matchesSearch = !this.searchText || 
        JSON.stringify(node.data).toLowerCase().includes(this.searchText.toLowerCase());
      const matchesType = !this.applicationType || 
        node.data.type === this.applicationType;
      return matchesSearch && matchesType;
    });
  }

  startEdit(node: TreeNode) {
    this.selectedNode = node;
    this.editForm = {
      name: node.data.name,
      type: node.data.type,
      idleDays: node.data.idleDays,
      assignedStaff: node.data.assignedStaff,
      
      // Action properties
      actionType: node.data.actionType,
      addressee: node.data.actionType === 'APICall' ? 
        node.data.addressee : 
        (Array.isArray(node.data.addressee) ? node.data.addressee : 
        (typeof node.data.addressee === 'string' ? node.data.addressee.split(',').map((a: string) => a.trim()) : [])),
      subject: node.data.subject,
      template: node.data.template,
      content: node.data.content,
      isReviewable: node.data.isReviewable === 'true',
      previewOnly: node.data.previewOnly === 'true',
      access: node.data.access,
      documentFolder: node.data.documentFolder,
      docType: node.data.docType,
      mailMergeDataSource: node.data.mailMergeDataSource,

      // Decision properties
      decisionType: node.data.decisionType,
      commencedBy: node.data.commencedBy,
      completedBy: node.data.completedBy,
      isCombineAllotment: node.data.isCombineAllotment === 'true',
      isSubdivision: node.data.isSubdivision === 'true',
      displayLocation: node.data.displayLocation,
      costOfDevelopment: node.data.costOfDevelopment,
      OPBuildingPart: node.data.OPBuildingPart,

      // Transition properties
      input: node.data.input,
      next: node.data.next,
      selectAttachment: node.data.selectAttachment === 'true',

      // Template properties
      saveToRelatedDoc: node.data.saveToRelatedDoc === 'true',
      securePDF: node.data.securePDF === 'true'
    };
    this.editDialogVisible = true;
  }

  saveEdit() {
    if (this.selectedNode) {
      const oldTreeData = this.createComparableTree(this.treeData);
      const oldName = this.selectedNode.data.name;
      
      this.selectedNode.data = {
        ...this.selectedNode.data,
        name: this.editForm.name,
        type: this.editForm.type,
        idleDays: this.editForm.idleDays,
        assignedStaff: this.editForm.assignedStaff,
        
        // Action properties
        actionType: this.editForm.actionType,
        addressee: this.editForm.actionType === 'APICall' ? 
          this.editForm.addressee : 
          (Array.isArray(this.editForm.addressee) ? this.editForm.addressee : []),
        subject: this.editForm.subject,
        template: this.editForm.template,
        content: this.editForm.content,
        isReviewable: this.editForm.isReviewable?.toString(),
        previewOnly: this.editForm.previewOnly?.toString(),
        access: this.editForm.access,
        documentFolder: this.editForm.documentFolder,
        docType: this.editForm.docType,
        mailMergeDataSource: this.editForm.mailMergeDataSource,

        // Decision properties
        decisionType: this.editForm.decisionType,
        commencedBy: this.editForm.commencedBy,
        completedBy: this.editForm.completedBy,
        isCombineAllotment: this.editForm.isCombineAllotment?.toString(),
        isSubdivision: this.editForm.isSubdivision?.toString(),
        displayLocation: this.editForm.displayLocation,
        costOfDevelopment: this.editForm.costOfDevelopment,
        OPBuildingPart: this.editForm.OPBuildingPart,

        // Transition properties
        input: this.editForm.input,
        next: this.editForm.next,
        selectAttachment: this.editForm.selectAttachment?.toString(),

        // Template properties
        saveToRelatedDoc: this.editForm.saveToRelatedDoc?.toString(),
        securePDF: this.editForm.securePDF?.toString()
      };

      // Save to history if changes were made
      const newTreeData = this.createComparableTree(this.treeData);
      if (JSON.stringify(oldTreeData) !== JSON.stringify(newTreeData)) {
        this.saveToHistory(this.treeData, `Edited ${this.selectedNode.data.type} "${oldName}" to "${this.editForm.name}"`);
      }
    }
    this.editDialogVisible = false;
    this.selectedNode = null;
  }

  cancelEdit() {
    this.editDialogVisible = false;
    this.selectedNode = null;
  }

  getMenuItems(node: TreeNode): MenuItem[] {
    return [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.startEdit(node)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteNode(node)
      }
    ];
  }

  deleteNode(node: TreeNode) {
    const oldTreeData = this.createComparableTree(this.treeData);
    const removeFromParent = (parent: TreeNode[], target: TreeNode) => {
      const index = parent.indexOf(target);
      if (index > -1) {
        parent.splice(index, 1);
      }
    };

    if (node.parent) {
      removeFromParent(node.parent.children || [], node);
    } else {
      removeFromParent(this.treeData, node);
    }

    // Save to history if changes were made
    const newTreeData = this.createComparableTree(this.treeData);
    if (JSON.stringify(oldTreeData) !== JSON.stringify(newTreeData)) {
      this.saveToHistory(this.treeData, `Deleted ${node.data.type} "${node.data.name}"`);
    }
  }

  resetFilters() {
    this.searchText = '';
    this.applicationType = null;
    this.clearData();
  }

  private validateTreeStructure(nodes: TreeNode[]): boolean {
    for (const node of nodes) {
      // Check if state has any state children
      if (node.data.type === 'state' && node.children) {
        for (const child of node.children) {
          if (child.data.type === 'state') {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Invalid tree structure: States cannot be nested inside other states'
            });
            return false;
          }
          // Recursively check children
          if (child.children && !this.validateTreeStructure(child.children)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  loadWorkflow(jsonData: WorkflowData) {
    try {
      console.log('Loading workflow data:', jsonData);
      
      if (jsonData.state) {
        // Store workflow metadata with default values
        this.workflowName = jsonData._name || "BuildingPermit";
        this.initialStatus = jsonData._initialStatus || "New";
        this.emailAdmin = jsonData._EmailAdmin || "no";
        this.smsAdmin = jsonData._SMSAdmin || "no";
        this.preAppInitStatus = jsonData._PreAppInitStatus || "NewPreApplication";

        const states = jsonData.state;
        this.treeData = states.map((state) => {
          return {
            data: {
              type: 'state',
              name: state._name || 'Unnamed State',
              idleDays: state._IdleDays || "0",
              assignedStaff: state._assignedStaff || '',
              // Add default values for other properties
              isActive: state._isActive === 'true' || false,
              isRequired: state._isRequired === 'true' || false,
              description: state._description || '',
              category: state._category || 'default'
            },
            children: this.mapTransitions(state.transition || [])
          };
        });

        // Validate the tree structure after loading
        if (!this.validateTreeStructure(this.treeData)) {
          this.treeData = [];
          return;
        }

        // Save initial state to history
        this.historyStack = [cloneDeep(this.treeData)];
        this.currentHistoryIndex = 0;
        this.updateUndoRedoState();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Loaded ${states.length} states successfully`
        });

        // After mapping states, update dragDropNodes
        this.dragDropNodes = [...this.treeData];
      } else {
        throw new Error('Invalid workflow format: missing state property');
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to parse workflow data'
      });
    }
  }

  private mapTransitions(transitions: Transition | Transition[]): TreeNode[] {
    // If transitions is a single object, convert it to an array
    const transitionsArray = Array.isArray(transitions) ? transitions : [transitions];
    
    return transitionsArray.map((transition) => {
      const node: TreeNode = {
        data: {
          type: 'transition',
          name: transition._input || 'Unnamed Transition',
          input: transition._input || '',
          next: transition._next || '',
          selectAttachment: transition._selectAttachment === 'true' || false,
          // Add default values for other properties
          isActive: transition._isActive === 'true' || false,
          isRequired: transition._isRequired === 'true' || false,
          description: transition._description || '',
          category: transition._category || 'default'
        },
        children: []
      };

      const nodeChildren: TreeNode[] = [];

      // Add actions if present
      if (transition.action?.length) {
        const actionNodes: TreeNode[] = [];
        
        transition.action.forEach((action) => {
          // Handle regular action with default values
          const actionNode = this.createActionNode(action);
          actionNodes.push(actionNode);

          // Handle letter templates if present
          if (action.letters?.template) {
            const templates = Array.isArray(action.letters.template) ? 
              action.letters.template : [action.letters.template];
            
            templates.forEach((template) => {
              actionNodes.push(this.createTemplateNode(template));
            });
          }
        });

        nodeChildren.push(...actionNodes);
      }

      // Add reminders if present
      if (transition.reminder?.length) {
        const reminderNodes = transition.reminder.map((reminder) => 
          this.createReminderNode(reminder)
        );
        nodeChildren.push(...reminderNodes);
      }

      // Add business rules if present
      if (transition.businessRules?.rule?.length) {
        const ruleNodes = transition.businessRules.rule.map((rule) => 
          this.createBusinessRuleNode(rule)
        );
        nodeChildren.push(...ruleNodes);
      }

      node.children = nodeChildren;
      return node;
    });
  }

  private createActionNode(action: Action): TreeNode {
    return {
      data: {
        type: 'action',
        name: action._template || action._content || action._addressee || 'Unnamed Action',
        actionType: action._type || 'email',
        addressee: action._addressee ? action._addressee.split(',') : [],
        subject: action._subject || '',
        template: action._template || '',
        content: action._content || '',
        isReviewable: action._isReviewable === 'true' || false,
        previewOnly: action._previewOnly === 'true' || false,
        access: action._access || '',
        documentFolder: action._documentFolder || '',
        docType: action._docType || '',
        mailMergeDataSource: action._mailMergeDataSource || '',
        decisionType: action._decisionType || '',
        commencedBy: action._commencedBy || '',
        completedBy: action._completedBy || '',
        isCombineAllotment: action._isCombineAllotment === 'true' || false,
        isSubdivision: action._isSubdivision === 'true' || false,
        displayLocation: action._displayLocation || '',
        costOfDevelopment: action._costOfDevelopment || '',
        OPBuildingPart: action._OPBuildingPart || '',
        // Add default values for other properties
        isActive: action._isActive === 'true' || false,
        isRequired: action._isRequired === 'true' || false,
        description: action._description || '',
        category: action._category || 'default'
      },
      children: []
    };
  }

  private createTemplateNode(template: Template): TreeNode {
    return {
      data: {
        type: 'template',
        name: template._name || 'Unnamed Template',
        saveToRelatedDoc: template._saveToRelatedDoc || false,
        securePDF: template._securePDF || false,
        // Add default values for other properties
        isActive: template._isActive === 'true' || false,
        isRequired: template._isRequired === 'true' || false,
        description: template._description || '',
        category: template._category || 'default'
      },
      children: []
    };
  }

  private createReminderNode(reminder: Reminder): TreeNode {
    return {
      data: {
        type: 'reminder',
        name: reminder._content || 'Unnamed Reminder',
        content: reminder._content || '',
        // Add default values for other properties
        isActive: reminder._isActive === 'true' || false,
        isRequired: reminder._isRequired === 'true' || false,
        description: reminder._description || '',
        category: reminder._category || 'default'
      },
      children: []
    };
  }

  private createBusinessRuleNode(rule: BusinessRule): TreeNode {
    return {
      data: {
        type: 'rule',
        name: rule._name || 'Unnamed Rule',
        errorMessage: rule._ErrorMessage || '',
        // Add default values for other properties
        isActive: rule._isActive === 'true' || false,
        isRequired: rule._isRequired === 'true' || false,
        description: rule._description || '',
        category: rule._category || 'default'
      },
      children: []
    };
  }

  onFileUpload(event: any) {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          this.loadWorkflow(jsonData);
          this.fileUploaded = true;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'JSON file loaded successfully'
          });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid JSON file'
          });
        }
      };
      reader.readAsText(file);
    }
  }

  onFileClear() {
    this.clearData();
  }

  downloadJson(): void {
    try {
      const downloadData: WorkflowData = {
        _name: this.workflowName || "BuildingPermit",
        _initialStatus: this.initialStatus || "New",
        _EmailAdmin: this.emailAdmin || "yes",
        _SMSAdmin: this.smsAdmin || "yes",
        _PreAppInitStatus: this.preAppInitStatus || "NewPreApplication",
        state: this.treeData.map(stateNode => {
          const state: State = {
            _name: stateNode.data.name,
            _IdleDays: stateNode.data.idleDays || "0"
          };

          if (stateNode.data.assignedStaff) {
            state._assignedStaff = stateNode.data.assignedStaff;
          }

          if (stateNode.children && stateNode.children.length > 0) {
            state.transition = stateNode.children.map(transNode => {
              const transition: Transition = {
                _input: transNode.data.input,
                _next: transNode.data.next,
                _selectAttachment: transNode.data.selectAttachment ? 'true' : 'false',
                action: [],    // Initialize arrays
                reminder: []   // Initialize arrays
              };

              if (transNode.children && transNode.children.length > 0) {
                transNode.children.forEach(child => {
                  if (child.data.type === 'action') {
                    const action: Action = {
                      _type: child.data.actionType as Action['_type'],
                      _addressee: Array.isArray(child.data.addressee) ? 
                        child.data.addressee.join(',') : child.data.addressee || '',
                      _template: child.data.template,
                      _subject: child.data.subject,
                      _isReviewable: child.data.isReviewable ? 'true' : 'false'
                    };

                    if (child.data.documentFolder) {
                      action._documentFolder = child.data.documentFolder;
                    }
                    if (child.data.docType) {
                      action._docType = child.data.docType;
                    }
                    if (child.data.content) {
                      action._content = child.data.content;
                    }
                    
                    transition.action?.push(action);
                  } else if (child.data.type === 'reminder') {
                    transition.reminder?.push({
                      _content: child.data.content
                    });
                  }
                });
              }
              return transition;
            });
          }
          return state;
        })
      };

      const jsonData = JSON.stringify(downloadData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'workflow.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Workflow downloaded successfully'
      });
    } catch (error) {
      console.error('Error downloading JSON:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download workflow'
      });
    }
  }

  openJsonEditor() {
    try {
      // Create the complete workflow data structure
      const workflowData: WorkflowData = {
        _name: this.workflowName || "BuildingPermit",
        _initialStatus: this.initialStatus || "New",
        _EmailAdmin: this.emailAdmin || "yes",
        _SMSAdmin: this.smsAdmin || "yes",
        _PreAppInitStatus: this.preAppInitStatus || "NewPreApplication",
        state: this.treeData.map(stateNode => {
          const state: State = {
            _name: stateNode.data.name,
            _IdleDays: stateNode.data.idleDays || "0"
          };

          if (stateNode.data.assignedStaff) {
            state._assignedStaff = stateNode.data.assignedStaff;
          }

          if (stateNode.children && stateNode.children.length > 0) {
            state.transition = stateNode.children.map(transNode => {
              const transition: Transition = {
                _input: transNode.data.input || transNode.data.name,
                _next: transNode.data.next || "",
                _selectAttachment: transNode.data.selectAttachment ? 'true' : 'false',
                action: [],
                reminder: []
              };

              if (transNode.children && transNode.children.length > 0) {
                transNode.children.forEach(child => {
                  if (child.data.type === 'action') {
                    const action: Action = {
                      _type: child.data.actionType as Action['_type'],
                      _addressee: Array.isArray(child.data.addressee) ? 
                        child.data.addressee.join(',') : child.data.addressee || '',
                      _template: child.data.template || '',
                      _subject: child.data.subject || '',
                      _isReviewable: child.data.isReviewable ? 'true' : 'false'
                    };
                    transition.action?.push(action);
                  } else if (child.data.type === 'reminder') {
                    transition.reminder?.push({
                      _content: child.data.content || ''
                    });
                  }
                });
              }
              return transition;
            });
          }
          return state;
        })
      };

      this.jsonEditorContent = JSON.stringify(workflowData, null, 2);
      this.showJsonEditor = true;
    } catch (error) {
      console.error('Error preparing JSON data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to prepare JSON data for editing'
      });
    }
  }

  closeJsonEditor() {
    this.showJsonEditor = false;
    this.jsonEditorContent = '';
  }

  applyJsonChanges() {
    try {
      const newData = JSON.parse(this.jsonEditorContent);
      this.loadWorkflow(newData);
      this.showJsonEditor = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'JSON changes applied successfully'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid JSON format'
      });
    }
  }

  clearData() {
    const oldTreeData = this.createComparableTree(this.treeData);
    this.treeData = [];
    this.fileUploaded = false;
    
    // Reset the file upload component
    const fileUpload = document.querySelector('p-fileUpload') as any;
    if (fileUpload?.clear) {
      fileUpload.clear();
    }

    // Save to history if changes were made
    const newTreeData = this.createComparableTree(this.treeData);
    if (JSON.stringify(oldTreeData) !== JSON.stringify(newTreeData)) {
      this.saveToHistory(this.treeData);
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Reset',
      detail: 'All data has been cleared'
    });
  }

  getEmptyNodeForm(): EditForm {
    return {
      name: '',
      actionType: 'email',
      addressee: []
    };
  }

  getAvailableNodeTypes(): Array<{label: string, value: string}> {
    if (!this.selectedNode) {
      // At root level, only allow State
      return [{ label: 'State', value: 'state' }];
    }

    const parentType = this.selectedNode.data._type || this.selectedNode.data.type;
    const config = this.nodeTypeConfigs[parentType];
    
    if (!config) {
      return [];
    }

    return config.allowedChildren.map(type => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: type
    }));
  }

  openAddNodeDialog(node?: TreeNode) {
    this.selectedNode = node || null;
    this.multiNodeForm = {
      type: '',
      nodes: [this.getEmptyNodeForm()]
    };
    this.showAddNodeDialog = true;
  }

  addNewNodeForm() {
    const emptyForm = this.getEmptyNodeForm();
    // Make sure these properties are properly initialized
    emptyForm.template = '';
    emptyForm.addressee = [];
    this.multiNodeForm.nodes.push(emptyForm);
  }

  removeNodeForm(index: number) {
    if (this.multiNodeForm.nodes.length > 1) {
      this.multiNodeForm.nodes.splice(index, 1);
    }
  }

  addNodes() {
    // Validate all nodes
    for (const nodeForm of this.multiNodeForm.nodes) {
      nodeForm.type = this.multiNodeForm.type;
      const validation = this.validateNewNode(nodeForm);
      if (!validation.valid) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: validation.message
        });
        return;
      }
    }

    // Add all nodes
    const oldTreeData = this.createComparableTree(this.treeData);
    const addedNodes: string[] = [];
    
    for (const nodeForm of this.multiNodeForm.nodes) {
      const newNode: TreeNode = {
        data: {
          type: nodeForm.type,
          name: nodeForm.name || nodeForm.input || 'New Node',
          ...this.getNodeSpecificData(nodeForm)
        },
        children: []
      };

      if (this.selectedNode) {
        if (!this.selectedNode.children) {
          this.selectedNode.children = [];
        }
        this.selectedNode.children.push(newNode);
      } else {
        this.treeData.push(newNode);
      }
      addedNodes.push(`${nodeForm.type} "${newNode.data.name}"`);
    }

    // Save to history if changes were made
    const newTreeData = this.createComparableTree(this.treeData);
    if (JSON.stringify(oldTreeData) !== JSON.stringify(newTreeData)) {
      const parentName = this.selectedNode ? ` to ${this.selectedNode.data.type} "${this.selectedNode.data.name}"` : '';
      this.saveToHistory(this.treeData, `Added ${addedNodes.join(', ')}${parentName}`);
    }

    this.showAddNodeDialog = false;
    this.multiNodeForm = {
      type: '',
      nodes: []
    };
    this.selectedNode = null;
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Added ${this.multiNodeForm.nodes.length} nodes successfully`
    });
  }

  validateNewNode(nodeForm: EditForm): { valid: boolean; message?: string } {
    if (!nodeForm.type) {
      return { valid: false, message: 'Please select a node type' };
    }

    const config = this.nodeTypeConfigs[nodeForm.type];
    
    // Check if parent type is valid
    if (this.selectedNode) {
      const parentType = this.selectedNode.data.type;
      if (!config.parentTypes.includes(parentType)) {
        return { 
          valid: false, 
          message: `${nodeForm.type} cannot be added to ${parentType}` 
        };
      }

      // Additional check for state nesting
      if (nodeForm.type === 'state') {
        let current: TreeNode | undefined = this.selectedNode;
        while (current) {
          if (current.data.type === 'state') {
            return {
              valid: false,
              message: 'States cannot be nested inside other states'
            };
          }
          current = current.parent;
        }
      }
    } else if (nodeForm.type !== 'state') {
      return { 
        valid: false, 
        message: 'Only states can be added at the root level' 
      };
    }

    // Check required fields
    for (const field of config.requiredFields) {
      const value = nodeForm[field as keyof EditForm];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return { 
          valid: false, 
          message: `${field} is required for ${nodeForm.type}` 
        };
      }
    }

    return { valid: true };
  }

  private getNodeSpecificData(nodeForm: EditForm): any {
    const data: any = {};
    
    switch (nodeForm.type) {
      case 'state':
        data.idleDays = nodeForm.idleDays;
        break;
      case 'transition':
        data.input = nodeForm.input;
        data.next = nodeForm.next;
        data.selectAttachment = nodeForm.selectAttachment;
        break;
      case 'action':
        data.actionType = nodeForm.actionType;
        if (nodeForm.actionType === 'APICall') {
          data.addressee = nodeForm.addressee;
        } else {
          const addresseeValue = nodeForm.addressee as string | string[];
          data.addressee = Array.isArray(addresseeValue) ? addresseeValue : 
            (typeof addresseeValue === 'string' ? addresseeValue.split(',').map((a: string) => a.trim()) : []);
        }
        data.subject = nodeForm.subject;
        data.template = nodeForm.template;
        data.content = nodeForm.content;
        break;
      case 'reminder':
        data.content = nodeForm.content;
        break;
      case 'template':
        data.name = nodeForm.name;
        data.saveToRelatedDoc = nodeForm.saveToRelatedDoc;
        data.securePDF = nodeForm.securePDF;
        break;
    }
    
    return data;
  }

  cancelAddNode() {
    this.showAddNodeDialog = false;
    this.multiNodeForm = {
      type: '',
      nodes: []
    };
    this.selectedNode = null;
  }

  // Add missing method
  filterNodes() {
    // If there's no search text or selected type, return all nodes
    if (!this.searchText && !this.selectedApplicationType) {
      return this.treeData;
    }

    // Filter nodes based on search text and selected type
    const filteredData = this.treeData.filter(node => {
      const matchesSearch = !this.searchText || 
        node.data.name.toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesType = !this.selectedApplicationType || 
        node.data.type === this.selectedApplicationType;

      return matchesSearch && matchesType;
    });

    return filteredData;
  }

  toggleTableCollapse() {
    this.isTableCollapsed = !this.isTableCollapsed;
  }

  // Add new method for handling ID submission
  onSubmitIds() {
    if (!this.licenseId || !this.applicationId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter both License ID and Application ID'
      });
      return;
    }
    this.workflowDataService.getSmsTemplates(this.licenseId, this.applicationId).subscribe({
      next: (Smstemplates) => {
        this.smsTemplates = Smstemplates; 
        console.log('SMS templates loaded:', Smstemplates); // Update SMS templates
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'SMS templates loaded successfully'
        });
      }
    });
    // Get assigned staff
    this.workflowDataService.getAssignedStaff(this.licenseId).subscribe({
      next: (staff) => {
        this.assignedStaffOptions = staff;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Staff list loaded successfully'
        });
        console.log('Assigned staff loaded:', staff);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load assigned staff'
        });
        console.error('Error loading assigned staff:', error);
      }
    });

    // Get email templates
    this.workflowDataService.getEmailTemplates(this.licenseId, this.applicationId).subscribe({
      next: (templates) => {
        this.emailTemplates = templates;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Email templates loaded successfully'
        });
        console.log('Email templates loaded:', templates);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load email templates'
        });
        console.error('Error loading templates:', error);
      }
    });

    // Get addressees
    this.workflowDataService.getAddressees().subscribe({
      next: (addressees) => {
        this.addresseeOptions = addressees;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Addressees loaded successfully'
        });
        console.log('Addressees loaded:', addressees);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load addressees'
        });
        console.error('Error loading addressees:', error);
      }
    });
  }

  onDragStart(event: any) {
    const draggedNode = event.dragNode;
    if (draggedNode.data.type === 'state') {
      this.draggedNode = draggedNode;
    }
  }

  onDragEnd(event: any) {
    this.draggedNode = null;
  }

  onDrop(event: any) {
    const draggedNode = event.dragNode;
    const targetNode = event.dropNode;
    
    if (draggedNode && targetNode) {
      const draggedNodeType = draggedNode.data.type;
      const targetNodeType = targetNode.data.type;

      // Prevent states from being nested inside other states
      if (draggedNodeType === 'state') {
        // Check if target is a state
        if (targetNodeType === 'state') {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'States cannot be nested inside other states'
          });
          return;
        }

        // Check if target is inside a state
        let current = targetNode.parent;
        while (current) {
          if (current.data.type === 'state') {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'States cannot be nested inside other states'
            });
            return;
          }
          current = current.parent;
        }
      }

      const oldTreeData = this.createComparableTree(this.treeData);

      // Update the tree structure
      this.updateTreeStructure(draggedNode, targetNode);
      
      // Update the workflow data
      this.updateWorkflowData();

      // Save to history if changes were made
      const newTreeData = this.createComparableTree(this.treeData);
      if (JSON.stringify(oldTreeData) !== JSON.stringify(newTreeData)) {
        this.saveToHistory(this.treeData, `Moved ${draggedNodeType} "${draggedNode.data.name}" to ${targetNodeType} "${targetNode.data.name}"`);
      }
      
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Node position updated'
      });
    }
  }

  private hasStateParent(node: TreeNode): boolean {
    let current = node.parent;
    while (current) {
      if (current.data.type === 'state') {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  private updateTreeStructure(draggedNode: TreeNode, targetNode: TreeNode) {
    // Remove dragged node from its current position
    const draggedParent = this.findParentNode(draggedNode, this.treeData);
    if (draggedParent && draggedParent.children) {
      draggedParent.children = draggedParent.children.filter(node => node !== draggedNode);
    } else {
      this.treeData = this.treeData.filter(node => node !== draggedNode);
    }

    // Add dragged node to new position
    if (targetNode.parent) {
      if (!targetNode.parent.children) {
        targetNode.parent.children = [];
      }
      targetNode.parent.children.push(draggedNode);
      draggedNode.parent = targetNode.parent;
    } else {
      this.treeData.push(draggedNode);
      draggedNode.parent = undefined;
    }
  }

  private findParentNode(node: TreeNode, nodes: TreeNode[]): TreeNode | null {
    for (const n of nodes) {
      if (n.children) {
        if (n.children.includes(node)) {
          return n;
        }
        const found = this.findParentNode(node, n.children);
        if (found) return found;
      }
    }
    return null;
  }

  private updateWorkflowData() {
    if (!this.workflowData) {
      this.workflowData = {
        _name: "BuildingPermit",
        _initialStatus: "New",
        _EmailAdmin: "yes",
        _SMSAdmin: "yes",
        _PreAppInitStatus: "NewPreApplication",
        state: []
      };
    }

    // Update the workflow data structure based on the new tree structure
    this.workflowData.state = this.treeData
      .filter(node => node.data.type === 'state')
      .map(node => ({
        _name: node.data.name,
        _IdleDays: node.data.idleDays || "0",
        _assignedStaff: node.data.assignedStaff || undefined
      }));
  }

  validateDragDrop(event: any): boolean {
    const draggedNode = event.dragNode;
    const targetNode = event.dropNode;
    
    // If dragging a state
    if (draggedNode.data.type === 'state') {
      // Check if target is a state
      if (targetNode.data.type === 'state') {
        return false;
      }
      
      // Check if target is inside a state
      let current = targetNode.parent;
      while (current) {
        if (current.data.type === 'state') {
          return false;
        }
        current = current.parent;
      }
    }
    
    return true;
  }

  private initializeContextMenu() {
    this.nodeMenu = [
      {
        label: 'Add Child',
        icon: 'pi pi-plus',
        command: (event) => {
          const node = event.item.node;
          this.openAddNodeDialog(node);
        }
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: (event) => {
          const node = event.item.node;
          this.startEdit(node);
        }
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: (event) => {
          const node = event.item.node;
          this.deleteNode(node);
        }
      }
    ];
  }

  isFirstState(node: TreeNode): boolean {
    if (node.data.type !== 'state') return false;
    const stateNodes = this.treeData.filter(n => n.data.type === 'state');
    return stateNodes.indexOf(node) === 0;
  }

  isLastState(node: TreeNode): boolean {
    if (node.data.type !== 'state') return false;
    const stateNodes = this.treeData.filter(n => n.data.type === 'state');
    return stateNodes.indexOf(node) === stateNodes.length - 1;
  }

  moveState(node: TreeNode, direction: 'up' | 'down') {
    if (node.data.type !== 'state') return;

    const oldTreeData = this.createComparableTree(this.treeData);
    const stateNodes = this.treeData.filter(n => n.data.type === 'state');
    const currentIndex = stateNodes.indexOf(node);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < stateNodes.length) {
      // Remove the node from its current position
      this.treeData = this.treeData.filter(n => n !== node);
      
      // Insert at the new position
      this.treeData.splice(newIndex, 0, node);

      // Save to history if changes were made
      const newTreeData = this.createComparableTree(this.treeData);
      if (JSON.stringify(oldTreeData) !== JSON.stringify(newTreeData)) {
        this.saveToHistory(this.treeData, `Moved state "${node.data.name}" ${direction}`);
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `State moved ${direction}`
      });
    }
  }

  openAddAddressDialog(node: TreeNode) {
    this.selectedNodeForAddress = node;
    this.newAddress = { label: '', value: '' };
    this.showAddAddressDialog = true;
  }

  cancelAddAddress() {
    this.showAddAddressDialog = false;
    this.selectedNodeForAddress = null;
    this.newAddress = { label: '', value: '' };
  }

  addNewAddress() {
    if (!this.newAddress.label || !this.newAddress.value) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in both label and value'
      });
      return;
    }

    // Add the new address to the options
    this.addresseeOptions.push({
      label: this.newAddress.label,
      value: this.newAddress.value
    });

    // Add the new address to the selected node's addressees
    if (this.selectedNodeForAddress) {
      const currentAddressees = Array.isArray(this.selectedNodeForAddress.data.addressee) 
        ? this.selectedNodeForAddress.data.addressee 
        : [];
      
      this.selectedNodeForAddress.data.addressee = [
        ...currentAddressees,
        this.newAddress.value
      ];
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'New address added successfully'
    });

    this.cancelAddAddress();
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  // Add history management methods
  private saveToHistory(treeData: TreeNode[], changeDescription: string = '') {
    // Remove any future states if we're not at the end of the history
    if (this.currentHistoryIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.currentHistoryIndex + 1);
      this.changeHistory = this.changeHistory.slice(0, this.currentHistoryIndex + 1);
    }

    // Add new state to history
    this.historyStack.push(cloneDeep(treeData));
    
    // Add change description to history
    if (changeDescription) {
      this.changeHistory.push({
        description: changeDescription,
        timestamp: new Date(),
        canUndo: true
      });
    }
    
    // Remove oldest state if we exceed max size
    if (this.historyStack.length > this.maxHistorySize) {
      this.historyStack.shift();
      this.changeHistory.shift();
    } else {
      this.currentHistoryIndex++;
    }

    this.updateUndoRedoState();
  }

  private updateUndoRedoState() {
    this.canUndo = this.currentHistoryIndex > 0;
    this.canRedo = this.currentHistoryIndex < this.historyStack.length - 1;
  }

  undo() {
    if (this.canUndo) {
      this.currentHistoryIndex--;
      this.treeData = cloneDeep(this.historyStack[this.currentHistoryIndex]);
      this.updateUndoRedoState();
      
      const undoneChange = this.changeHistory[this.currentHistoryIndex + 1];
      this.messageService.add({
        severity: 'info',
        summary: 'Undo',
        detail: `Undid: ${undoneChange?.description || 'Last action'}`
      });
    }
  }

  redo() {
    if (this.canRedo) {
      this.currentHistoryIndex++;
      this.treeData = cloneDeep(this.historyStack[this.currentHistoryIndex]);
      this.updateUndoRedoState();
      
      const redoneChange = this.changeHistory[this.currentHistoryIndex];
      this.messageService.add({
        severity: 'info',
        summary: 'Redo',
        detail: `Redid: ${redoneChange?.description || 'Action'}`
      });
    }
  }

  toggleChangeHistory() {
    this.showChangeHistory = !this.showChangeHistory;
  }

  // Add helper method to create comparable version of tree data
  private createComparableTree(nodes: TreeNode[]): any[] {
    return nodes.map(node => ({
      data: { ...node.data },
      children: node.children ? this.createComparableTree(node.children) : []
    }));
  }
}
